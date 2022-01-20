import { Form, Layout } from 'antd';
import React, { useReducer, useState } from 'react';
import styled from 'styled-components';
import StepWizard from 'react-step-wizard';
import Upload from './components/Upload';
import Verify from './components/Verify';
import InfoScreen from './components/InfoScreen';
import { useForm } from 'antd/lib/form/Form';
import Summary from './components/Summary';
import RoyaltiesCreators, { HOLAPLEX_CREATOR_OBJECT } from './components/RoyaltiesCreators';
import PriceSummary from './components/PriceSummary';
import MintInProgress from './components/MintInProgress';
import { isNil } from 'ramda';
import OffRampScreen from './components/OffRamp';
import { detectCategoryByFileExt, getFinalFileWithUpdatedName } from '../../utils/files';
import { Connection } from '@solana/web3.js';

export const STORAGE_UPLOAD_ENDPOINT =
  process.env.NEXT_PUBLIC_STORAGE_UPLOAD_ENDPOINT || '/api/ipfs/upload';

export const MAX_CREATOR_LIMIT = 4;

export interface Creator {
  address: string;
  share: number;
}

const StyledLayout = styled(Layout)`
  width: 100%;
  overflow: hidden;
`;

interface NFTFile {
  uri: string;
  type: string;
}

export interface UploadedFilePin extends NFTFile {
  name: string;
}

export type FormValues = { [key: string]: NFTFormValue };

type NFTCategory = 'image' | 'video' | 'audio' | 'vr' | 'html';

export interface NFTFormValue {
  name: string;
  imageName: string;
  coverImageFile?: File;
  description: string;
  collectionName: string;
  collectionFamily: string;
  attributes: Array<NFTAttribute>;
  seller_fee_basis_points: number;
  properties: { creators: Array<Creator>; maxSupply?: number };
}

export type FileOrString = NFTFile | string;

export type NFTAttribute = {
  trait_type: string;
  value: string | number;
};

export enum MintStatus {
  FAILED,
  SUCCESS,
}

export interface Collection {
  name: string;
  family: string;
}

export interface FilePreview {
  type: string;
  coverImage: File | null;
  file: File;
}

export interface NFTValue {
  name: string;
  description: string;
  attributes?: NFTAttribute[];
  symbol: string;
  image: string;
  collection?: Collection;
  seller_fee_basis_points: number;
  mintStatus?: MintStatus;
  animation_url?: string;

  properties: {
    files: FileOrString[];
    maxSupply?: number;
    creators?: Creator[];
    category: NFTCategory;
  };
}

export type MintDispatch = (action: MintAction) => void;

interface State {
  files: Array<File>;
  uploadedFiles: Array<UploadedFilePin>;
  filePreviews: Array<FilePreview>;
  formValues: NFTFormValue[] | null;
  nftValues: NFTValue[];
}

export interface MintAction {
  type:
    | 'SET_FILES'
    | 'DELETE_FILE'
    | 'ADD_FILE'
    | 'UPLOAD_FILES'
    | 'INSERT_COVER_IMAGE'
    | 'SET_FILE_PREVIEWS'
    | 'SET_FORM_VALUES'
    | 'SET_NFT_VALUES'
    | 'RESET_FORM';
  payload:
    | File[]
    | File
    | FilePreview[]
    | FilePreview
    | String
    | Array<UploadedFilePin>
    | NFTFormValue[]
    | NFTValue[]
    | { coverImage: File; index: number }
    | { file: File; index: number };
}

const initialState = (): State => {
  return {
    files: [],
    uploadedFiles: [],
    filePreviews: [],
    formValues: null,
    nftValues: [],
  };
};

function reducer(state: State, action: MintAction) {
  switch (action.type) {
    case 'SET_FILES':
      return { ...state, files: action.payload as File[] };
    case 'DELETE_FILE':
      return {
        ...state,
        files: state.files.filter((i) => i.name !== (action.payload as String)),
      };
    case 'ADD_FILE': {
      const file = action.payload as File;
      const numberOfDuplicates = state.files.filter((i) => i.name === file.name).length;

      return state.files.length < 10
        ? {
            ...state,
            files: [
              ...state.files,
              numberOfDuplicates > 0 ? getFinalFileWithUpdatedName(file, numberOfDuplicates) : file,
            ],
          }
        : state;
    }
    case 'SET_FILE_PREVIEWS':
      return { ...state, filePreviews: action.payload as FilePreview[] };
    case 'INSERT_COVER_IMAGE': {
      const { coverImage, index } = action.payload as { coverImage: File; index: number };

      const copy = { ...state.filePreviews[index], coverImage };
      const filePreviewsCopy = [...state.filePreviews];
      filePreviewsCopy[index] = { ...copy };
      return {
        ...state,
        filePreviews: filePreviewsCopy,
      };
    }

    case 'UPLOAD_FILES':
      return { ...state, uploadedFiles: action.payload as Array<UploadedFilePin> };
    case 'SET_FORM_VALUES':
      return { ...state, formValues: action.payload as NFTFormValue[] };
    case 'SET_NFT_VALUES':
      return { ...state, nftValues: action.payload as NFTValue[] };
    case 'RESET_FORM':
      return initialState();
    default:
      throw new Error('No valid action for state');
  }
}

interface Props {
  storefront: any;
  wallet: any;
  track: any;
  holaSignMetadata: any;
  onClose: () => void;
  connection: Connection;
  savedEndpoint?: string;
}

function BulkMinter({
  storefront,
  track,
  holaSignMetadata,
  onClose,
  wallet,
  connection,
  savedEndpoint,
}: Props) {
  const [state, dispatch] = useReducer(reducer, initialState());
  const [form] = useForm();

  const { files, formValues, filePreviews } = state;

  const [doEachRoyaltyInd, setDoEachRoyaltyInd] = useState(false);

  const uploadCoverImage = async (file: File) => {
    const body = new FormData();
    body.append(file.name, file, file.name);

    try {
      const resp = await fetch(STORAGE_UPLOAD_ENDPOINT, {
        method: 'POST',
        body,
      });
      const json = await resp.json();
      if (json) {
        return json.files[0];
      }
    } catch (e) {
      console.error('Could not upload file', e);
      throw new Error(e);
    }
  };

  const transformFormVal = async (
    value: NFTFormValue,
    index: number,
    filePins: UploadedFilePin[]
  ) => {
    const filePin = filePins[index];

    if (!filePin) {
      throw new Error('No file pin for index ' + index);
    }

    const category: NFTCategory = detectCategoryByFileExt(filePin.name);
    const isMultiMedia = category !== 'image';

    let coverImageFile: UploadedFilePin | undefined;
    if (value.coverImageFile) {
      coverImageFile = await uploadCoverImage(value.coverImageFile);
    }

    const files = [{ uri: filePin.uri, type: filePin.type }] as FileOrString[];

    let image = filePin.uri;
    if (coverImageFile) {
      files.push({ uri: coverImageFile.uri, type: coverImageFile.type });
      image = coverImageFile.uri;
    }

    const properties = { ...value.properties, category, files };

    const res: NFTValue = {
      name: value.name,
      description: value.description,
      symbol: '',
      seller_fee_basis_points: value.seller_fee_basis_points,
      image,
      collection: {
        name: value.collectionName,
        family: value.collectionFamily,
      },
      attributes: value.attributes.reduce((result: Array<NFTAttribute>, a: NFTAttribute) => {
        if (!isNil(a?.trait_type)) {
          result.push({ trait_type: a.trait_type, value: a.value });
        }
        return result;
      }, []),
      properties,
    };

    if (isMultiMedia) {
      res.animation_url = filePin.uri;
    }

    return res;
  };

  const onFinish = (values: FormValues) => {
    const arrayValues = Object.values(values);
    dispatch({ type: 'SET_FORM_VALUES', payload: arrayValues });
  };

  const setNFTValues = async (filePins: UploadedFilePin[]) => {
    if (!filePins?.length || !formValues?.length) {
      throw new Error('Either filePins or formValues are not set');
    }

    const nftVals = await Promise.all(
      formValues.map((v, i: number) => transformFormVal(v, i, filePins))
    );

    dispatch({ type: 'SET_NFT_VALUES', payload: nftVals });
  };

  const uploadMetaData = async (nftValue: NFTValue) => {
    const creators = nftValue.properties.creators as Creator[];
    const creatorArrayWithHolaplexLast = [...creators, HOLAPLEX_CREATOR_OBJECT];

    const nftWithHolaplexAsLastCreator: NFTValue = {
      ...nftValue,
      properties: {
        ...nftValue.properties,
        creators: creatorArrayWithHolaplexLast,
      },
    };

    const metaData = new File([JSON.stringify(nftWithHolaplexAsLastCreator)], 'metadata');
    const metaDataFileForm = new FormData();
    metaDataFileForm.append(`file[${metaData.name}]`, metaData, metaData.name);
    const resp = await fetch(STORAGE_UPLOAD_ENDPOINT, {
      body: metaDataFileForm,
      method: 'POST',
    });

    const json = await resp.json(); // TODO: Type this

    const payload: UploadedFilePin = json.files[0];

    return Promise.resolve(payload);
  };

  const updateNFTValue = (value: NFTValue, index: number) => {
    const nftValues = [...state.nftValues];
    nftValues[index] = value;
    dispatch({ type: 'SET_NFT_VALUES', payload: nftValues });
  };

  function handleKeyDown(e: React.KeyboardEvent<HTMLFormElement>) {
    // Prevent Enter submit
    if (e.key === 'Enter') {
      e.preventDefault();
    }
  }

  if (!wallet) {
    return null;
  }
  const pubKey = wallet.publicKey.toBase58();

  return (
    <Form
      name="bulk-mint"
      form={form}
      onFinish={onFinish}
      requiredMark={false}
      layout="vertical"
      onKeyDown={handleKeyDown}
    >
      <StyledLayout>
        <StepWizard
          isHashEnabled={false} // I don't think this will work unless we take the upload part out of the wizard and generate all steps based on the uploaded images
          isLazyMount={true}
          transitions={{
            enterLeft: undefined,
            enterRight: undefined,
            exitRight: undefined,
            exitLeft: undefined,
          }}
        >
          <Upload dispatch={dispatch} files={files} hashKey="upload" onClose={onClose} />
          <Verify
            files={files}
            dispatch={dispatch}
            onClose={onClose}
            track={track}
            hashKey="verify"
          />
          {
            files.map((file, index) => (
              <InfoScreen
                files={files}
                filePreviews={filePreviews}
                index={index}
                currentFile={file}
                key={index}
                form={form}
                onClose={onClose}
                isLast={index === files.length - 1}
                dispatch={dispatch}
              />
            )) as any // Very annoying TS error here only solved by any
          }
          <RoyaltiesCreators
            files={files}
            filePreviews={filePreviews}
            form={form}
            userKey={pubKey}
            formValues={state.formValues}
            dispatch={dispatch}
            isFirst={true}
            setDoEachRoyaltyInd={setDoEachRoyaltyInd}
            doEachRoyaltyInd={doEachRoyaltyInd}
            index={0}
            onClose={onClose}
            track={track}
          />
          {doEachRoyaltyInd &&
            files
              .slice(1)
              .map((_, index) => (
                <RoyaltiesCreators
                  files={files}
                  filePreviews={filePreviews}
                  form={form}
                  userKey={pubKey}
                  formValues={state.formValues}
                  dispatch={dispatch}
                  key={index + 1}
                  index={index + 1}
                  setDoEachRoyaltyInd={setDoEachRoyaltyInd}
                  doEachRoyaltyInd={doEachRoyaltyInd}
                  onClose={onClose}
                  track={track}
                />
              ))}
          <Summary
            files={files}
            filePreviews={filePreviews}
            hashKey="summary"
            dispatch={dispatch}
            form={form}
            formValues={state.formValues}
            setNFTValues={setNFTValues}
            onClose={onClose}
            doEachRoyaltyInd={doEachRoyaltyInd}
            track={track}
          />
          <PriceSummary
            files={files}
            filePreviews={filePreviews}
            hashKey="priceSummary"
            onClose={onClose}
            track={track}
            pubKey={pubKey}
            connection={connection}
          />
          {files.map((_, index) => (
            <MintInProgress
              key={index}
              files={files}
              filePreviews={filePreviews}
              wallet={wallet}
              uploadMetaData={uploadMetaData}
              nftValues={state.nftValues}
              updateNFTValue={updateNFTValue}
              index={index}
              hashKey="mint"
              onClose={onClose}
              isLast={index === files.length - 1}
              track={track}
              holaSignMetadata={holaSignMetadata}
              connection={connection}
              savedEndpoint={savedEndpoint}
            />
          ))}
          <OffRampScreen
            hashKey="success"
            dispatch={dispatch}
            filePreviews={filePreviews}
            files={files}
            onClose={onClose}
            nftValues={state.nftValues}
            storefront={storefront}
          />
        </StepWizard>
      </StyledLayout>
    </Form>
  );
}

export default BulkMinter;
