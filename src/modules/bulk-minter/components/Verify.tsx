import { PageHeader, Upload, Space, notification } from 'antd';
import React from 'react';
import styled from 'styled-components';
import XCloseIcon from '../../../assets/images/x-close.svg';
import { StepWizardChildProps } from 'react-step-wizard';
import NavContainer from './NavContainer';
import { MintDispatch } from '../index';
import { MAX_FILES, NFT_MIME_TYPE_UPLOAD_VALIDATION_STRING, MAX_FILE_SIZE } from './Upload';
import { RcFile } from 'antd/lib/upload';
import { is3DFile, isImage } from '../../../utils/files';
import VerifyFileUpload from '../../../components/VerifyFileUpload';
import Button from '../../../components/Button';

const Header = styled(PageHeader)`
  font-style: normal;
  font-weight: 900;
  font-size: 48px;
  line-height: 65px;
  text-align: center;
  width: 701px;
  margin-top: 102px;
  color: #fff;
`;

const AddNFTButton = styled.button`
  width: 120px;
  height: 120px;
  background: #262626;
  border: none;
  border-radius: 4px;
  cursor: pointer;

  img {
    transform: rotate(45deg);
  }
`;

interface Props extends Partial<StepWizardChildProps> {
  files: Array<File>;
  dispatch: MintDispatch;
  onClose: () => void;
  track: any; // need to import type
}

export default function Verify({
  previousStep,
  nextStep,
  dispatch,
  goToStep,
  files,
  onClose,
  track,
}: Props) {
  const handleNext = () => {
    const filePreviews = files.map((file) => {
      let type = file.type;
      if (is3DFile(file)) {
        type = 'model/glb';
      }

      return {
        type,
        file,
        coverImage: isImage(file) ? file : null,
      };
    });

    dispatch({ type: 'SET_FILE_PREVIEWS', payload: filePreviews }); // Set all file types as cover images despite not all types being images, we will detect on display whether to show a placeholder or not

    track('Mint Initiated', {
      event_category: 'Minter',
      totalItems: filePreviews.length,
    });

    nextStep!();
  };

  const removeFile = (fileName: string) => {
    dispatch({ type: 'DELETE_FILE', payload: fileName });
  };

  const handlePrevious = () => {
    onClose();
    previousStep!();
  };

  const beforeUpload = (f: RcFile) => {
    const { size, name } = f;
    if (size && size > MAX_FILE_SIZE) {
      notification.error({
        message: `The file name ${name} you are trying to upload is ${(size / 1000000).toFixed(
          0,
        )}MB, only files equal to or under ${MAX_FILE_SIZE / 1000000}MB are allowed`,
      });

      return;
    }
    dispatch({ type: 'ADD_FILE', payload: f });
  };

  return (
    <NavContainer previousStep={handlePrevious} goToStep={goToStep} onClose={onClose}>
      <Space direction="vertical" size={80} align="center">
        <Header>Do these look right?</Header>
        {/* Does this need children?  Can we just put it all into one component? */}
        <VerifyFileUpload removeFile={removeFile} files={files} width={5}>
          {files.length < MAX_FILES && (
            <Upload
              accept={NFT_MIME_TYPE_UPLOAD_VALIDATION_STRING}
              showUploadList={false}
              beforeUpload={beforeUpload}
            >
              <AddNFTButton>
                <img width={24} height={24} src={XCloseIcon} alt="x-close" />
              </AddNFTButton>
            </Upload>
          )}
        </VerifyFileUpload>
        <Button type="primary" size="large" onClick={handleNext}>
          Looks good
        </Button>
      </Space>
    </NavContainer>
  );
}
