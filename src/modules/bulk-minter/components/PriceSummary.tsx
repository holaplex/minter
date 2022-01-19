import { Divider, Form, Row, Col, Button } from 'antd';
import React, { useEffect, useState } from 'react';
import { StepWizardChildProps } from 'react-step-wizard';
import styled from 'styled-components';
import Paragraph from 'antd/lib/typography/Paragraph';
import { Coingecko, Currency } from '@metaplex/js';
import NavContainer from './NavContainer';
import { Connection, LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js';
import { FilePreview } from '..';
import Price from '../../../components/Price';
import { NFTPreviewGrid } from '../../../components/NFTPreviewGrid';

const SOL_COST_PER_NFT = 0.01;

const StyledDivider = styled(Divider)`
  background-color: rgba(255, 255, 255, 0.1);
`;

const ButtonFormItem = styled(Form.Item)`
  .ant-form-item-control-input-content {
    display: flex;
    flex-direction: row-reverse;
  }
`;

async function getSolRate() {
  const rates = await new Coingecko().getRate([Currency.SOL], Currency.USD);
  return rates[0].rate;
}

interface Props extends Partial<StepWizardChildProps> {
  files: Array<File>;
  filePreviews: Array<FilePreview>;
  connection: Connection;
  onClose: () => void;
  track: any; // need to figure out how to import types for this and wallet
  pubKey: string;
}

export default function PriceSummary({
  previousStep,
  goToStep,
  filePreviews,
  files,
  nextStep,
  connection,
  pubKey,
  track,
  onClose,
}: Props) {
  const [totalSolCost, setTotalSolCost] = useState(files.length * SOL_COST_PER_NFT);
  const [totalInUSD, setTotalInUSD] = useState(0.0);
  const [solBalanceInLamports, setSolBalance] = useState(-1);
  const hasEnoughSol =
    (solBalanceInLamports === -1 || solBalanceInLamports) >= totalSolCost * SOL_COST_PER_NFT;

  useEffect(() => {
    if (pubKey) {
      connection
        .getBalance(new PublicKey(pubKey))
        .then((balance) => setSolBalance(balance / LAMPORTS_PER_SOL));
    }
  }, [pubKey, connection]);

  useEffect(() => {
    const total = files.length * SOL_COST_PER_NFT;
    setTotalSolCost(total);

    getSolRate().then((rate) => {
      setTotalInUSD(rate * total);
    });
  }, [files, setTotalSolCost, setTotalInUSD]);

  const handleNext = () => {
    track('Mint price Confirmed', {
      event_category: 'Minter',
      userSolBalance: solBalanceInLamports,
      costToMint: totalSolCost,
      sol_value: totalSolCost,
      hasEnoughSol,
    });
    nextStep!();
  };

  return (
    <NavContainer title="Fees" previousStep={previousStep} goToStep={goToStep} onClose={onClose}>
      <Row>
        <Col style={{ width: 360 }}>
          <Row>
            <Paragraph style={{ fontWeight: 900 }}>Cost to mint {files.length} NFTs</Paragraph>
          </Row>
          <Row>
            <Col style={{ width: '100%' }}>
              <Row justify="space-between" align="middle">
                <span style={{ fontSize: 14, opacity: 0.6 }}>
                  Estimated network fee x{files.length}
                </span>
                <Price size={14} price={SOL_COST_PER_NFT} />
              </Row>
            </Col>
          </Row>
          <StyledDivider />
          <Row justify="space-between">
            <Paragraph style={{ opacity: 0.6, fontSize: 14 }}>Total:</Paragraph>
            <Col>
              <Row>
                <Price size={18} price={totalSolCost} />
              </Row>
              <Row justify="end">
                <Paragraph style={{ fontSize: 14, opacity: 0.6 }}>
                  ${totalInUSD.toFixed(2)}
                </Paragraph>
              </Row>
            </Col>
          </Row>
          <Row justify="end">
            {!hasEnoughSol && (
              <Paragraph style={{ fontSize: 14 }} className="text-theme-color">
                Not enough SOL in this wallet.
              </Paragraph>
            )}
          </Row>
          <Row justify="end">
            <ButtonFormItem style={{ marginTop: 20 }}>
              <Button type="primary" onClick={handleNext} disabled={!hasEnoughSol}>
                Mint {files.length} NFTs
              </Button>
            </ButtonFormItem>
          </Row>
        </Col>
        <StyledDivider type="vertical" style={{ margin: '0 46px', height: 500 }} />
        <NFTPreviewGrid filePreviews={filePreviews} />
      </Row>
    </NavContainer>
  );
}
