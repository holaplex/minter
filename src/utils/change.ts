export interface ChangeNonprofit {
    name: string;
    description: string;
    ein: string;
    classification: string;
    category: string;
    address_line: string;
    city: string;
    state: string;
    zip_code: string;
    icon_url: string;
    email?: string;
    website: string;
    socials: {
        facebook?: string;
        instagram?: string;
        tiktok?: string;
        twitter?: string;
        youtube?: string;
      }
      crypto: {
        solana_address: string;
        ethereum_address: string;
      }
}

export const CHANGE_BASE_URL = 'https://getchange.io/donate/cause/';