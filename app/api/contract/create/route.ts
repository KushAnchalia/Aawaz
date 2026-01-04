import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    try {
        const { description } = await req.json();

        if (!description) {
            return NextResponse.json(
                { error: "Description is required" },
                { status: 400 }
            );
        }

        // Heuristic template generation
        let programName = "my_solana_program";
        let instructions = "";

        if (description.toLowerCase().includes("crowdfunding")) {
            programName = "crowdfunding_campaign";
            instructions = `
    pub fn initialize(ctx: Context<Initialize>, goal: u64) -> Result<()> {
        let campaign = &mut ctx.accounts.campaign;
        campaign.admin = *ctx.accounts.user.key;
        campaign.goal = goal;
        campaign.amount_raised = 0;
        Ok(())
    }

    pub fn donate(ctx: Context<Donate>, amount: u64) -> Result<()> {
        let campaign = &mut ctx.accounts.campaign;
        campaign.amount_raised += amount;
        Ok(())
    }
    
    pub fn withdraw(ctx: Context<Withdraw>, amount: u64) -> Result<()> {
        let campaign = &mut ctx.accounts.campaign;
        let user = &mut ctx.accounts.user;
        if campaign.admin != *user.key {
             return Err(ErrorCode::Unauthorized.into());
        }
        **campaign.to_account_info().try_borrow_mut_lamports()? -= amount;
        **user.to_account_info().try_borrow_mut_lamports()? += amount;
        Ok(())
    }`;
        } else if (description.toLowerCase().includes("token")) {
            programName = "token_mint";
            instructions = `
    pub fn initialize_mint(ctx: Context<InitializeMint>, decimals: u8) -> Result<()> {
        msg!("Token mint initialized with {} decimals", decimals);
        Ok(())
    }
       `;
        } else {
            // Generic template
            instructions = `
    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        msg!("Program initialized");
        Ok(())
    }
        `;
        }

        const code = `
use anchor_lang::prelude::*;

declare_id!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");

#[program]
pub mod ${programName} {
    use super::*;

${instructions}
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(init, payer = user, space = 8 + 8)]
    pub campaign: Account<'info, Campaign>,
    #[account(mut)]
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[account]
pub struct Campaign {
    pub admin: Pubkey,
    pub goal: u64,
    pub amount_raised: u64,
}

#[error_code]
pub enum ErrorCode {
    #[msg("You are not authorized to perform this action.")]
    Unauthorized,
}
`;

        return NextResponse.json({
            success: true,
            code: code.trim(),
            explanation: "Generated Anchor program based on description."
        });

    } catch (error: any) {
        return NextResponse.json(
            { error: error.message || "Failed to generate contract" },
            { status: 500 }
        );
    }
}
