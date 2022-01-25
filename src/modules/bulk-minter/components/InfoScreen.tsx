import { Divider, Input, Form, FormInstance, Row, Upload, Button } from 'antd';
import React, { useState } from 'react';
import { StepWizardChildProps } from 'react-step-wizard';
import styled from 'styled-components';
import XCloseIcon from '../../../assets/images/x-close.svg';
import { FormListFieldData } from 'antd/lib/form/FormList';
import { FilePreview, FormValues, MintDispatch, NFTAttribute, NFTFormValue } from '../index';
import Text from 'antd/lib/typography/Text';
import { is3DFile, isAudio, isVideo } from '../../../utils/files';
import NavContainer from './NavContainer';
import { NFTPreviewGrid } from '../../../components/NFTPreviewGrid';
import { StyledClearButton } from './RoyaltiesCreators';

const ACCEPTED_IMAGE_FILES = 'image/.jpg,image/.jpeg,image/.png';

const StyledDivider = styled(Divider)`
  background-color: rgba(255, 255, 255, 0.1);
  height: 500px;
  margin: 0 46px;
`;

const FormWrapper = styled.div`
  width: 413px;

  .ant-form-item-label {
    font-weight: 900;
  }

  .ant-form-item-control-input-content {
    input,
    textarea {
      border-radius: 4px;
    }
    input {
      height: 50px;
    }
  }
`;

const StyledButton = styled(Button)`
  border-radius: 4px;
  width: 39px;
  height: 50px;
  display: flex;
  justify-content: center;
  align-items: center;

  img {
    opacity: 0.5;
  }
`;

const AttributeClearButton = (props: { onClick: () => void }) => {
  return (
    <StyledButton {...props} className="attribute-clear-btn">
      <img width={24} height={24} src={XCloseIcon} alt="remove-attribute" />
    </StyledButton>
  );
};

const ButtonFormItem = styled(Form.Item)`
  .ant-form-item-control-input-content {
    display: flex;
    flex-direction: row-reverse;
  }
`;

interface Props extends Partial<StepWizardChildProps> {
  files: Array<File>;
  filePreviews: Array<FilePreview>;
  index: number;
  form: FormInstance;
  onClose: () => void;
  currentFile: File;
  isLast: boolean;
  dispatch: MintDispatch;
}

export default function InfoScreen({
  previousStep,
  goToStep,
  files,
  index,
  nextStep,
  form,
  isActive,
  onClose,
  filePreviews,
  isLast,
  dispatch,
  currentFile,
}: Props) {
  const { TextArea } = Input;
  const nftNumber = `nft-${index}`;
  const nftNumberList = files.map((_, i) => `nft-${i}`);
  const [errorList, setErrorList] = useState<string[]>([]);
  const nftList = form.getFieldsValue(nftNumberList) as FormValues;
  const previousNFT: NFTFormValue | undefined = nftList[`nft-${index - 1}`];
  const showCoverUpload = isVideo(currentFile) || isAudio(currentFile) || is3DFile(currentFile);

  const handleNext = () => {
    const fieldsToValidate = [
      [nftNumber, 'name'],
      [nftNumber, 'attributes'],
      [nftNumber, 'description'],
    ];

    if (showCoverUpload) {
      fieldsToValidate.push([nftNumber, 'coverImageFile']);
    }

    setErrorList([]);
    form
      .validateFields(fieldsToValidate)
      .then((_: { [nftN: string]: { name: string; attributes: NFTAttribute[] } }) => {
        if (isLast) {
          const values2 = form.getFieldsValue(nftNumberList) as FormValues;

          const arrayValues = Object.values(values2).filter((v) => v !== undefined);
          dispatch({ type: 'SET_FORM_VALUES', payload: arrayValues });
        }
        nextStep!();
      })
      .catch(
        (errorInfo: {
          errorFields: {
            name: string[];
            errors: string[];
          }[];
        }) => {
          console.error('errorInfo', errorInfo);
          setErrorList(
            errorInfo.errorFields // only handle attribute errors
              .filter((ef) => ef.name.includes('attributes'))
              .map((ef) => ef?.errors)
              .flat()
          );
        }
      );
  };

  const AttributeRow = ({
    remove,
    fieldsLength,
    field,
  }: {
    remove: (index: number | number[]) => void;
    fieldsLength: number;
    field: FormListFieldData;
  }) => (
    <Input.Group style={{ marginBottom: 18, display: 'flex', flexDirection: 'row' }}>
      <Form.Item name={[field.name, 'trait_type']}>
        <Input style={{ width: 178, marginRight: 10, borderRadius: 4 }} placeholder="e.g. Color" />
      </Form.Item>
      <Form.Item name={[field.name, 'value']}>
        <Input style={{ width: 178, marginRight: 8, borderRadius: 4 }} placeholder="e.g. Green" />
      </Form.Item>
      {fieldsLength > 1 && <AttributeClearButton onClick={() => remove(field.name)} />}
    </Input.Group>
  );

  const getCoverImage = (e: any) => {
    console.log('e is ', e);
    let coverImage;
    if (e.file && e.file.originFileObj) {
      coverImage = e.file.originFileObj;
    } else if (Array.isArray(e)) {
      coverImage = e[0];
    } else {
      coverImage = e;
    }

    dispatch({
      type: 'INSERT_COVER_IMAGE',
      payload: {
        index,
        coverImage,
      },
    });
    return coverImage;
  };

  if (!isActive) {
    return null;
  }

  return (
    <NavContainer
      title={`Info for #${index + 1} of ${files.length}`}
      previousStep={previousStep}
      goToStep={goToStep}
      onClose={onClose}
    >
      <Row>
        <FormWrapper>
          <Form.Item
            name={[nftNumber, 'name']}
            initialValue={files[index]?.name || ''}
            label="Name"
            rules={[
              {
                message:
                  'The resulting Buffer length from the NFT name can not be longer than 32. Please reduce the length of the name of your NFT.',
                async validator(_, value) {
                  if (Buffer.from(value).length > 28) {
                    throw new Error();
                  }
                },
              },
            ]}
          >
            <Input placeholder="optional" autoFocus />
          </Form.Item>
          {showCoverUpload && (
            <Form.Item
              name={[nftNumber, 'coverImageFile']}
              getValueFromEvent={getCoverImage}
              rules={[{ required: true, message: 'Cover image is required' }]}
            >
              <Upload accept={ACCEPTED_IMAGE_FILES} maxCount={1} showUploadList={true}>
                <Button>Upload Cover Image</Button>
              </Upload>
            </Form.Item>
          )}
          <Form.Item
            name={[nftNumber, 'description']}
            label="Description"
            initialValue={previousNFT ? previousNFT.description : ''}
            rules={[
              {
                message: 'Max 500 characters',
                async validator(_, value) {
                  if (value.length > 500) {
                    throw new Error();
                  }
                },
              },
            ]}
          >
            <TextArea placeholder="optional" autoSize={{ minRows: 3, maxRows: 8 }} />
          </Form.Item>
          <Form.Item
            name={[nftNumber, 'collectionName']}
            label="Collection Name"
            initialValue={previousNFT ? previousNFT.collectionName : ''}
          >
            <Input placeholder="e.g., Solflare X NFT (optional)" />
          </Form.Item>
          <Form.Item
            name={[nftNumber, 'collectionFamily']}
            label="Collection Family"
            initialValue={previousNFT ? previousNFT.collectionFamily : ''}
          >
            <Input placeholder="e.g., Solflare (optional)" />
          </Form.Item>
          <Form.Item label="Attributes">
            <Form.List
              name={[nftNumber, 'attributes']}
              initialValue={
                previousNFT
                  ? previousNFT?.attributes.map((a) => ({
                      trait_type: a.trait_type,
                      value: undefined,
                    }))
                  : [{ trait_type: undefined, value: undefined }]
              }
              rules={[
                {
                  message: 'All attributes must have defined trait types',
                  async validator(_, value: NFTAttribute[]) {
                    if (value.length === 1) return;
                    if (value.some((a) => !a?.trait_type)) {
                      throw new Error();
                    }
                  },
                },
                {
                  message: 'All attributes with a trait type must have a value',
                  async validator(_, value: NFTAttribute[]) {
                    if (value.some((a) => a?.trait_type && !a?.value)) {
                      throw new Error();
                    }
                  },
                },
              ]}
            >
              {(fields, { add, remove }) => (
                <>
                  {fields.map((field) => (
                    <AttributeRow
                      key={field.key}
                      remove={remove}
                      fieldsLength={fields.length}
                      field={field}
                    />
                  ))}
                  {errorList.map((error, j) => (
                    <div key={j}>
                      <Text type="danger">{error}</Text>
                    </div>
                  ))}
                  {fields.length < 10 && (
                    <StyledClearButton
                      onClick={() => add()}
                      type="default"
                      className="no-style-btn text-theme-color "
                    >
                      Add Attribute
                    </StyledClearButton>
                  )}
                </>
              )}
            </Form.List>
          </Form.Item>
          <ButtonFormItem style={{ marginTop: 42 }}>
            <Button type="primary" onClick={handleNext}>
              Next
            </Button>
          </ButtonFormItem>
        </FormWrapper>
        <StyledDivider type="vertical" />
        <NFTPreviewGrid filePreviews={filePreviews} index={index} width={2} />
      </Row>
    </NavContainer>
  );
}
