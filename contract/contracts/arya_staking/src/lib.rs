#![no_std]

use soroban_sdk::{
    contract, contractimpl, contracttype, symbol_short, Address, BytesN, Env,
};

const REWARD_SCALE: i128 = 1_000_000_000;

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct StakingSettings {
    pub owner: Address,
    pub stake_token: Address,
    pub xlm_reward_token: Address,
    pub usdc_reward_token: Address,
    pub min_lockup_days: u32,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct RewardPool {
    pub reward_token: Address,
    pub reward_per_token: i128,
    pub deposited_rewards: i128,
    pub queued_rewards: i128,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct StakePosition {
    pub staked_amount: i128,
    pub reward_debt_xlm: i128,
    pub reward_debt_usdc: i128,
    pub pending_xlm: i128,
    pub pending_usdc: i128,
    pub lock_until: u64,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum RewardAsset {
    Xlm,
    Usdc,
}

#[contracttype]
pub enum DataKey {
    Settings,
    TotalStaked,
    Position(Address),
    Pool(RewardAsset),
}

#[contract]
pub struct AryaStaking;

#[contractimpl]
impl AryaStaking {
    pub fn initialize(
        env: Env,
        owner: Address,
        stake_token: Address,
        xlm_reward_token: Address,
        usdc_reward_token: Address,
        min_lockup_days: u32,
    ) {
        if env.storage().instance().has(&DataKey::Settings) {
            panic!("already initialized");
        }

        let settings = StakingSettings {
            owner,
            stake_token,
            xlm_reward_token: xlm_reward_token.clone(),
            usdc_reward_token: usdc_reward_token.clone(),
            min_lockup_days,
        };

        env.storage().instance().set(&DataKey::Settings, &settings);
        env.storage().instance().set(&DataKey::TotalStaked, &0i128);
        env.storage().persistent().set(
            &DataKey::Pool(RewardAsset::Xlm),
            &RewardPool {
                reward_token: xlm_reward_token,
                reward_per_token: 0,
                deposited_rewards: 0,
                queued_rewards: 0,
            },
        );
        env.storage().persistent().set(
            &DataKey::Pool(RewardAsset::Usdc),
            &RewardPool {
                reward_token: usdc_reward_token,
                reward_per_token: 0,
                deposited_rewards: 0,
                queued_rewards: 0,
            },
        );
    }

    pub fn upgrade(env: Env, new_wasm_hash: BytesN<32>) {
        let settings = Self::get_settings(env.clone());
        settings.owner.require_auth();
        env.deployer().update_current_contract_wasm(new_wasm_hash);
    }

    pub fn stake(env: Env, staker: Address, amount: i128, lockup_days: u32) {
        staker.require_auth();
        if amount <= 0 {
            panic!("invalid amount");
        }

        let settings = Self::get_settings(env.clone());
        if lockup_days < settings.min_lockup_days {
            panic!("lockup too short");
        }

        Self::settle_queued_rewards(&env);
        let mut position = Self::sync_position(&env, staker.clone());

        let token = soroban_sdk::token::Client::new(&env, &settings.stake_token);
        token.transfer(&staker, &env.current_contract_address(), &amount);

        position.staked_amount += amount;
        let now = env.ledger().timestamp();
        let next_lock = now + (lockup_days as u64 * 24 * 60 * 60);
        if next_lock > position.lock_until {
            position.lock_until = next_lock;
        }

        let total = Self::get_total_staked(env.clone()) + amount;
        env.storage().instance().set(&DataKey::TotalStaked, &total);
        Self::update_reward_debts(&env, &mut position);
        env.storage()
            .persistent()
            .set(&DataKey::Position(staker.clone()), &position);

        env.events()
            .publish((symbol_short!("stake"), staker), (amount, total));
    }

    pub fn unstake(env: Env, staker: Address, amount: i128) {
        staker.require_auth();
        if amount <= 0 {
            panic!("invalid amount");
        }

        Self::settle_queued_rewards(&env);
        let mut position = Self::sync_position(&env, staker.clone());
        if position.staked_amount < amount {
            panic!("insufficient stake");
        }
        if env.ledger().timestamp() < position.lock_until {
            panic!("stake locked");
        }

        position.staked_amount -= amount;
        let total = Self::get_total_staked(env.clone()) - amount;
        env.storage().instance().set(&DataKey::TotalStaked, &total);
        Self::update_reward_debts(&env, &mut position);
        env.storage()
            .persistent()
            .set(&DataKey::Position(staker.clone()), &position);

        let settings = Self::get_settings(env.clone());
        let token = soroban_sdk::token::Client::new(&env, &settings.stake_token);
        token.transfer(&env.current_contract_address(), &staker, &amount);

        env.events()
            .publish((symbol_short!("unstake"), staker), (amount, total));
    }

    pub fn claim_rewards(env: Env, staker: Address) -> (i128, i128) {
        staker.require_auth();
        Self::settle_queued_rewards(&env);
        let mut position = Self::sync_position(&env, staker.clone());

        let xlm_amount = position.pending_xlm;
        let usdc_amount = position.pending_usdc;
        if xlm_amount <= 0 && usdc_amount <= 0 {
            panic!("no rewards");
        }

        let settings = Self::get_settings(env.clone());
        if xlm_amount > 0 {
            let xlm = soroban_sdk::token::Client::new(&env, &settings.xlm_reward_token);
            xlm.transfer(&env.current_contract_address(), &staker, &xlm_amount);
            position.pending_xlm = 0;
        }
        if usdc_amount > 0 {
            let usdc = soroban_sdk::token::Client::new(&env, &settings.usdc_reward_token);
            usdc.transfer(&env.current_contract_address(), &staker, &usdc_amount);
            position.pending_usdc = 0;
        }

        Self::update_reward_debts(&env, &mut position);
        env.storage()
            .persistent()
            .set(&DataKey::Position(staker.clone()), &position);

        env.events()
            .publish((symbol_short!("claim"), staker), (xlm_amount, usdc_amount));

        (xlm_amount, usdc_amount)
    }

    pub fn deposit_xlm_rewards(env: Env, from: Address, amount: i128) {
        Self::deposit_rewards(env, from, amount, RewardAsset::Xlm);
    }

    pub fn deposit_usdc_rewards(env: Env, from: Address, amount: i128) {
        Self::deposit_rewards(env, from, amount, RewardAsset::Usdc);
    }

    pub fn get_settings(env: Env) -> StakingSettings {
        env.storage()
            .instance()
            .get(&DataKey::Settings)
            .expect("not initialized")
    }

    pub fn get_total_staked(env: Env) -> i128 {
        env.storage().instance().get(&DataKey::TotalStaked).unwrap_or(0)
    }

    pub fn get_position(env: Env, staker: Address) -> StakePosition {
        env.storage()
            .persistent()
            .get(&DataKey::Position(staker))
            .unwrap_or(Self::empty_position())
    }

    pub fn get_pool(env: Env, reward_asset: RewardAsset) -> RewardPool {
        env.storage()
            .persistent()
            .get(&DataKey::Pool(reward_asset))
            .expect("pool missing")
    }

    fn deposit_rewards(env: Env, from: Address, amount: i128, reward_asset: RewardAsset) {
        if amount <= 0 {
            panic!("invalid amount");
        }

        let mut pool = Self::get_pool(env.clone(), reward_asset.clone());
        let total_staked = Self::get_total_staked(env.clone());
        pool.deposited_rewards += amount;
        if total_staked <= 0 {
            pool.queued_rewards += amount;
        } else {
            pool.reward_per_token += amount * REWARD_SCALE / total_staked;
        }

        env.storage()
            .persistent()
            .set(&DataKey::Pool(reward_asset.clone()), &pool);
        env.events()
            .publish((symbol_short!("reward"), reward_asset), (from, amount));
    }

    fn settle_queued_rewards(env: &Env) {
        let total_staked = Self::get_total_staked(env.clone());
        if total_staked <= 0 {
            return;
        }

        for asset in [RewardAsset::Xlm, RewardAsset::Usdc] {
            let mut pool = Self::get_pool(env.clone(), asset.clone());
            if pool.queued_rewards > 0 {
                pool.reward_per_token += pool.queued_rewards * REWARD_SCALE / total_staked;
                pool.queued_rewards = 0;
                env.storage()
                    .persistent()
                    .set(&DataKey::Pool(asset), &pool);
            }
        }
    }

    fn sync_position(env: &Env, staker: Address) -> StakePosition {
        let mut position = Self::get_position(env.clone(), staker);
        if position.staked_amount <= 0 {
            return position;
        }

        let xlm_pool = Self::get_pool(env.clone(), RewardAsset::Xlm);
        let usdc_pool = Self::get_pool(env.clone(), RewardAsset::Usdc);

        let accrued_xlm = position.staked_amount * xlm_pool.reward_per_token / REWARD_SCALE;
        let accrued_usdc = position.staked_amount * usdc_pool.reward_per_token / REWARD_SCALE;

        if accrued_xlm > position.reward_debt_xlm {
            position.pending_xlm += accrued_xlm - position.reward_debt_xlm;
        }
        if accrued_usdc > position.reward_debt_usdc {
            position.pending_usdc += accrued_usdc - position.reward_debt_usdc;
        }

        position.reward_debt_xlm = accrued_xlm;
        position.reward_debt_usdc = accrued_usdc;
        position
    }

    fn update_reward_debts(env: &Env, position: &mut StakePosition) {
        let xlm_pool = Self::get_pool(env.clone(), RewardAsset::Xlm);
        let usdc_pool = Self::get_pool(env.clone(), RewardAsset::Usdc);
        position.reward_debt_xlm = position.staked_amount * xlm_pool.reward_per_token / REWARD_SCALE;
        position.reward_debt_usdc = position.staked_amount * usdc_pool.reward_per_token / REWARD_SCALE;
    }

    fn empty_position() -> StakePosition {
        StakePosition {
            staked_amount: 0,
            reward_debt_xlm: 0,
            reward_debt_usdc: 0,
            pending_xlm: 0,
            pending_usdc: 0,
            lock_until: 0,
        }
    }
}

#[cfg(test)]
mod test;
