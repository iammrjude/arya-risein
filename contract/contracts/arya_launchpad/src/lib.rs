#![no_std]

use arya_staking::AryaStakingClient;
use soroban_sdk::{
    contract, contractimpl, contracttype, symbol_short, Address, BytesN, Env,
};

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum FundingAsset {
    Xlm,
    Usdc,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum SaleStatus {
    Active,
    Successful,
    Failed,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct PlatformSettings {
    pub owner: Address,
    pub treasury_wallet: Address,
    pub staking_contract: Address,
    pub xlm_token: Address,
    pub usdc_token: Address,
    pub fee_basis_points: u32,
    pub staking_share_basis_points: u32,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Sale {
    pub id: u32,
    pub project_owner: Address,
    pub sale_token: Address,
    pub token_price: i128,
    pub token_supply: i128,
    pub tokens_sold: i128,
    pub total_raised: i128,
    pub soft_cap: i128,
    pub hard_cap: i128,
    pub start_time: u64,
    pub end_time: u64,
    pub funding_asset: FundingAsset,
    pub status: SaleStatus,
    pub funds_withdrawn: bool,
    pub unsold_reclaimed: bool,
}

#[contracttype]
pub enum DataKey {
    Settings,
    SaleCount,
    Sale(u32),
    Contribution(u32, Address),
    Claimed(u32, Address),
}

#[contract]
pub struct AryaLaunchpad;

#[contractimpl]
impl AryaLaunchpad {
    pub fn initialize(
        env: Env,
        owner: Address,
        treasury_wallet: Address,
        staking_contract: Address,
        xlm_token: Address,
        usdc_token: Address,
        fee_basis_points: u32,
        staking_share_basis_points: u32,
    ) {
        if env.storage().instance().has(&DataKey::Settings) {
            panic!("already initialized");
        }
        let settings = PlatformSettings {
            owner,
            treasury_wallet,
            staking_contract,
            xlm_token,
            usdc_token,
            fee_basis_points,
            staking_share_basis_points,
        };
        env.storage().instance().set(&DataKey::Settings, &settings);
        env.storage().instance().set(&DataKey::SaleCount, &0u32);
    }

    pub fn upgrade(env: Env, new_wasm_hash: BytesN<32>) {
        let settings = Self::get_platform_settings(env.clone());
        settings.owner.require_auth();
        env.deployer().update_current_contract_wasm(new_wasm_hash);
    }

    #[allow(clippy::too_many_arguments)]
    pub fn create_sale(
        env: Env,
        project_owner: Address,
        sale_token: Address,
        token_price: i128,
        token_supply: i128,
        soft_cap: i128,
        hard_cap: i128,
        start_time: u64,
        end_time: u64,
        funding_asset: FundingAsset,
    ) -> u32 {
        project_owner.require_auth();
        if token_price <= 0 || token_supply <= 0 || hard_cap <= 0 || soft_cap <= 0 {
            panic!("invalid sale");
        }
        if soft_cap > hard_cap {
            panic!("soft cap above hard cap");
        }
        if start_time >= end_time || end_time <= env.ledger().timestamp() {
            panic!("invalid schedule");
        }
        if token_supply * token_price < hard_cap {
            panic!("insufficient inventory");
        }

        let sale_token_client = soroban_sdk::token::Client::new(&env, &sale_token);
        sale_token_client.transfer(
            &project_owner,
            &env.current_contract_address(),
            &token_supply,
        );

        let id: u32 = env.storage().instance().get(&DataKey::SaleCount).unwrap_or(0);
        let sale = Sale {
            id,
            project_owner: project_owner.clone(),
            sale_token,
            token_price,
            token_supply,
            tokens_sold: 0,
            total_raised: 0,
            soft_cap,
            hard_cap,
            start_time,
            end_time,
            funding_asset,
            status: SaleStatus::Active,
            funds_withdrawn: false,
            unsold_reclaimed: false,
        };
        env.storage().persistent().set(&DataKey::Sale(id), &sale);
        env.storage().instance().set(&DataKey::SaleCount, &(id + 1));
        env.events()
            .publish((symbol_short!("sale"), id), project_owner);
        id
    }

    pub fn contribute(env: Env, buyer: Address, sale_id: u32, amount: i128) {
        buyer.require_auth();
        if amount <= 0 {
            panic!("invalid amount");
        }

        let mut sale = Self::get_sale(env.clone(), sale_id);
        if !matches!(sale.status, SaleStatus::Active) {
            panic!("sale inactive");
        }
        let now = env.ledger().timestamp();
        if now < sale.start_time || now > sale.end_time {
            panic!("sale not open");
        }
        if amount % sale.token_price != 0 {
            panic!("amount must match price increments");
        }
        if sale.total_raised + amount > sale.hard_cap {
            panic!("hard cap exceeded");
        }

        let tokens_reserved = amount / sale.token_price;
        if sale.tokens_sold + tokens_reserved > sale.token_supply {
            panic!("sold out");
        }

        let token = Self::funding_token(&env, &sale.funding_asset);
        token.transfer(&buyer, &env.current_contract_address(), &amount);

        let previous: i128 = env
            .storage()
            .persistent()
            .get(&DataKey::Contribution(sale_id, buyer.clone()))
            .unwrap_or(0);
        env.storage()
            .persistent()
            .set(&DataKey::Contribution(sale_id, buyer.clone()), &(previous + amount));

        sale.total_raised += amount;
        sale.tokens_sold += tokens_reserved;
        env.storage().persistent().set(&DataKey::Sale(sale_id), &sale);
        env.events()
            .publish((symbol_short!("buy"), sale_id), (buyer, amount));
    }

    pub fn withdraw_funds(env: Env, sale_id: u32) {
        let mut sale = Self::get_sale(env.clone(), sale_id);
        sale.project_owner.require_auth();
        if env.ledger().timestamp() <= sale.end_time {
            panic!("sale not ended");
        }
        if sale.total_raised < sale.soft_cap {
            panic!("sale failed");
        }
        if sale.funds_withdrawn {
            panic!("already withdrawn");
        }

        let settings = Self::get_platform_settings(env.clone());
        let fee = sale.total_raised * settings.fee_basis_points as i128 / 10_000;
        let staking_share = fee * settings.staking_share_basis_points as i128 / 10_000;
        let treasury_share = fee - staking_share;
        let project_share = sale.total_raised - fee;

        let token = Self::funding_token(&env, &sale.funding_asset);
        if treasury_share > 0 {
            token.transfer(
                &env.current_contract_address(),
                &settings.treasury_wallet,
                &treasury_share,
            );
        }
        if project_share > 0 {
            token.transfer(
                &env.current_contract_address(),
                &sale.project_owner,
                &project_share,
            );
        }
        if staking_share > 0 {
            token.transfer(
                &env.current_contract_address(),
                &settings.staking_contract,
                &staking_share,
            );
            let staking = AryaStakingClient::new(&env, &settings.staking_contract);
            match sale.funding_asset {
                FundingAsset::Xlm => {
                    staking.deposit_xlm_rewards(&env.current_contract_address(), &staking_share);
                }
                FundingAsset::Usdc => {
                    staking.deposit_usdc_rewards(&env.current_contract_address(), &staking_share);
                }
            }
        }

        sale.status = SaleStatus::Successful;
        sale.funds_withdrawn = true;
        env.storage().persistent().set(&DataKey::Sale(sale_id), &sale);
        env.events().publish(
            (symbol_short!("settle"), sale_id),
            (project_share, treasury_share, staking_share),
        );
    }

    pub fn claim_tokens(env: Env, buyer: Address, sale_id: u32) -> i128 {
        buyer.require_auth();
        let sale = Self::get_sale(env.clone(), sale_id);
        if env.ledger().timestamp() <= sale.end_time {
            panic!("sale not ended");
        }
        if sale.total_raised < sale.soft_cap {
            panic!("sale failed");
        }
        let claimed: bool = env
            .storage()
            .persistent()
            .get(&DataKey::Claimed(sale_id, buyer.clone()))
            .unwrap_or(false);
        if claimed {
            panic!("already claimed");
        }

        let contribution = Self::get_contribution(env.clone(), sale_id, buyer.clone());
        if contribution <= 0 {
            panic!("no contribution");
        }
        let token_amount = contribution / sale.token_price;
        let sale_token = soroban_sdk::token::Client::new(&env, &sale.sale_token);
        sale_token.transfer(&env.current_contract_address(), &buyer, &token_amount);
        env.storage()
            .persistent()
            .set(&DataKey::Claimed(sale_id, buyer.clone()), &true);
        env.events()
            .publish((symbol_short!("claim"), sale_id), (buyer, token_amount));
        token_amount
    }

    pub fn claim_refund(env: Env, buyer: Address, sale_id: u32) {
        buyer.require_auth();
        let sale = Self::get_sale(env.clone(), sale_id);
        if env.ledger().timestamp() <= sale.end_time {
            panic!("sale not ended");
        }
        if sale.total_raised >= sale.soft_cap {
            panic!("sale successful");
        }

        let claimed: bool = env
            .storage()
            .persistent()
            .get(&DataKey::Claimed(sale_id, buyer.clone()))
            .unwrap_or(false);
        if claimed {
            panic!("already claimed");
        }
        let contribution = Self::get_contribution(env.clone(), sale_id, buyer.clone());
        if contribution <= 0 {
            panic!("no contribution");
        }

        let token = Self::funding_token(&env, &sale.funding_asset);
        token.transfer(&env.current_contract_address(), &buyer, &contribution);
        env.storage()
            .persistent()
            .set(&DataKey::Claimed(sale_id, buyer.clone()), &true);
    }

    pub fn reclaim_unsold_tokens(env: Env, sale_id: u32) {
        let mut sale = Self::get_sale(env.clone(), sale_id);
        sale.project_owner.require_auth();
        if env.ledger().timestamp() <= sale.end_time {
            panic!("sale not ended");
        }
        if sale.unsold_reclaimed {
            panic!("already reclaimed");
        }

        let unsold = sale.token_supply - sale.tokens_sold;
        if unsold > 0 {
            let token = soroban_sdk::token::Client::new(&env, &sale.sale_token);
            token.transfer(&env.current_contract_address(), &sale.project_owner, &unsold);
        }
        sale.unsold_reclaimed = true;
        if sale.total_raised < sale.soft_cap {
            sale.status = SaleStatus::Failed;
        }
        env.storage().persistent().set(&DataKey::Sale(sale_id), &sale);
    }

    pub fn get_platform_settings(env: Env) -> PlatformSettings {
        env.storage()
            .instance()
            .get(&DataKey::Settings)
            .expect("not initialized")
    }

    pub fn get_sale(env: Env, sale_id: u32) -> Sale {
        env.storage()
            .persistent()
            .get(&DataKey::Sale(sale_id))
            .expect("sale not found")
    }

    pub fn get_sale_count(env: Env) -> u32 {
        env.storage().instance().get(&DataKey::SaleCount).unwrap_or(0)
    }

    pub fn get_contribution(env: Env, sale_id: u32, buyer: Address) -> i128 {
        env.storage()
            .persistent()
            .get(&DataKey::Contribution(sale_id, buyer))
            .unwrap_or(0)
    }

    fn funding_token<'a>(
        env: &'a Env,
        funding_asset: &'a FundingAsset,
    ) -> soroban_sdk::token::Client<'a> {
        let settings = Self::get_platform_settings(env.clone());
        let token = match funding_asset {
            FundingAsset::Xlm => settings.xlm_token,
            FundingAsset::Usdc => settings.usdc_token,
        };
        soroban_sdk::token::Client::new(env, &token)
    }
}

#[cfg(test)]
mod test;
