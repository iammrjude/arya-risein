#![no_std]

use soroban_sdk::{contract, contractevent, contractimpl, contracttype, Address, BytesN, Env};

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct RegistryConfig {
    pub owner: Address,
    pub treasury: Address,
    pub arya_token: Address,
    pub xlm_token: Address,
    pub usdc_token: Address,
    pub staking_contract: Address,
    pub crowdfunding_contract: Address,
    pub launchpad_contract: Address,
}

#[contracttype]
pub enum DataKey {
    Config,
}

#[contractevent(topics = ["arya", "registry_initialized"])]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct RegistryInitializedEvent {
    pub owner: Address,
    pub treasury: Address,
    pub arya_token: Address,
    pub xlm_token: Address,
    pub usdc_token: Address,
    pub staking_contract: Address,
    pub crowdfunding_contract: Address,
    pub launchpad_contract: Address,
}

#[contractevent(topics = ["arya", "treasury_updated"])]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct TreasuryUpdatedEvent {
    pub treasury: Address,
}

#[contractevent(topics = ["arya", "contracts_updated"])]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct ContractsUpdatedEvent {
    pub staking_contract: Address,
    pub crowdfunding_contract: Address,
    pub launchpad_contract: Address,
}

#[contractevent(topics = ["arya", "ownership_transferred"])]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct OwnershipTransferredEvent {
    pub new_owner: Address,
}

#[contract]
pub struct AryaRegistry;

#[contractimpl]
impl AryaRegistry {
    pub fn initialize(env: Env, config: RegistryConfig) {
        if env.storage().instance().has(&DataKey::Config) {
            panic!("already initialized");
        }

        env.storage().instance().set(&DataKey::Config, &config);
        RegistryInitializedEvent {
            owner: config.owner,
            treasury: config.treasury,
            arya_token: config.arya_token,
            xlm_token: config.xlm_token,
            usdc_token: config.usdc_token,
            staking_contract: config.staking_contract,
            crowdfunding_contract: config.crowdfunding_contract,
            launchpad_contract: config.launchpad_contract,
        }
        .publish(&env);
    }

    pub fn upgrade(env: Env, new_wasm_hash: BytesN<32>) {
        let config = Self::get_config(env.clone());
        config.owner.require_auth();
        env.deployer().update_current_contract_wasm(new_wasm_hash);
    }

    pub fn get_config(env: Env) -> RegistryConfig {
        env.storage()
            .instance()
            .get(&DataKey::Config)
            .expect("not initialized")
    }

    pub fn set_treasury(env: Env, treasury: Address) {
        let mut config = Self::get_config(env.clone());
        config.owner.require_auth();
        config.treasury = treasury.clone();
        env.storage().instance().set(&DataKey::Config, &config);
        TreasuryUpdatedEvent { treasury }.publish(&env);
    }

    pub fn set_contracts(
        env: Env,
        staking_contract: Address,
        crowdfunding_contract: Address,
        launchpad_contract: Address,
    ) {
        let mut config = Self::get_config(env.clone());
        config.owner.require_auth();
        config.staking_contract = staking_contract.clone();
        config.crowdfunding_contract = crowdfunding_contract.clone();
        config.launchpad_contract = launchpad_contract.clone();
        env.storage().instance().set(&DataKey::Config, &config);
        ContractsUpdatedEvent {
            staking_contract,
            crowdfunding_contract,
            launchpad_contract,
        }
        .publish(&env);
    }

    pub fn transfer_ownership(env: Env, new_owner: Address) {
        let mut config = Self::get_config(env.clone());
        config.owner.require_auth();
        config.owner = new_owner.clone();
        env.storage().instance().set(&DataKey::Config, &config);
        OwnershipTransferredEvent { new_owner }.publish(&env);
    }
}

#[cfg(test)]
mod test;
