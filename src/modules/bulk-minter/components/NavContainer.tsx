import { Layout, PageHeader } from 'antd';
import React from 'react';
import styled from 'styled-components';
import ArrowLeft from '../../../assets/images/arrow-left.svg';
import XCloseIcon from '../../../assets/images/x-close.svg';
import { StepWizardChildProps } from 'react-step-wizard';
import { StyledClearButton } from './RoyaltiesCreators';

const Header = styled(PageHeader)`
  font-style: normal;
  font-weight: 900;
  font-size: 24px;
  line-height: 65px;
  text-align: center;
  color: #fff;
  padding-top: 10px;
`;

const StyledLayout = styled(Layout)`
  display: flex;
  align-items: center;
`;

const XClose = styled.i`
  position: absolute;
  top: 32px;
  right: 40px;
  cursor: pointer;
`;

const GoBack = styled.i`
  position: absolute;
  top: 32px;
  left: 40px;
  cursor: pointer;
`;

const AltClearTextLink = StyledClearButton;

interface Props extends Partial<StepWizardChildProps> {
  children?: React.ReactElement | React.ReactElement[] | boolean;
  title?: string;
  altClearText?: string;
  showNavigation?: boolean;
  onClose: () => void;
}

export default function NavContainer({
  previousStep,
  children,
  title,
  onClose,
  altClearText,
  showNavigation = true,
}: Props) {
  return (
    <StyledLayout>
      {showNavigation && previousStep && (
        <GoBack onClick={previousStep}>
          <img width={24} height={24} src={ArrowLeft} alt="arrow-left" />
        </GoBack>
      )}

      {showNavigation && (
        <XClose
          onClick={() => {
            if (
              altClearText ||
              window.confirm(
                'Are you sure you want cancel? This will exit the minter and all progress will be lost.',
              )
            ) {
              onClose();
            }
          }}
          style={{ fontStyle: 'normal' }}
        >
          {altClearText ? (
            <AltClearTextLink noStyle type="text">
              {altClearText}
            </AltClearTextLink>
          ) : (
            <img width={24} height={24} src={XCloseIcon} alt="x-close" />
          )}
        </XClose>
      )}

      {title && <Header>{title}</Header>}
      {children}
    </StyledLayout>
  );
}
