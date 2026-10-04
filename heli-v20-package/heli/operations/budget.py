"""Transparent HELI cash sufficiency model; assumptions, not a price forecast."""
from dataclasses import dataclass
from math import ceil

LAMPORTS_PER_SOL = 1_000_000_000
MONTHS = 720
RENT_LAMPORTS_PER_BYTE_YEAR_FACTOR = 6_960  # local LiteSVM result: 2 * 3,480
PROGRAM_DATA_OVERHEAD = 45
EPOCH_RENT_LAMPORTS = 1_837_440 + 2 * 2_039_280  # epoch + two 165-byte token accounts
BASE_FEE_LAMPORTS_PER_SIGNATURE = 5_000  # current official Solana documentation


@dataclass(frozen=True)
class Budget:
    program_bytes: int
    sold_heli: int
    average_quote_per_heli: float
    quote_per_sol: float
    setup_extra_sol: float = 0
    yearly_offchain_quote: float = 0
    transactions_per_month: int = 3
    priority_fee_lamports_per_transaction: int = 0
    safety_multiplier: float = 1.25

    def calculate(self) -> dict:
        if self.program_bytes <= 0 or not 0 <= self.sold_heli <= 4_000_000:
            raise ValueError("Invalid program size or sold HELI")
        if self.average_quote_per_heli < 0 or self.quote_per_sol <= 0:
            raise ValueError("Prices must be nonnegative and SOL quote price must be positive")
        if self.setup_extra_sol < 0 or self.yearly_offchain_quote < 0 or self.transactions_per_month < 0:
            raise ValueError("Costs must be nonnegative")
        if self.priority_fee_lamports_per_transaction < 0 or self.safety_multiplier < 1:
            raise ValueError("Invalid priority fee or safety multiplier")

        program_rent_sol = (self.program_bytes + PROGRAM_DATA_OVERHEAD + 128) * RENT_LAMPORTS_PER_BYTE_YEAR_FACTOR / LAMPORTS_PER_SOL
        pre_sale_sol = program_rent_sol + self.setup_extra_sol
        epoch_rent_sol = MONTHS * EPOCH_RENT_LAMPORTS / LAMPORTS_PER_SOL
        network_fee_sol = MONTHS * self.transactions_per_month * (
            BASE_FEE_LAMPORTS_PER_SIGNATURE + self.priority_fee_lamports_per_transaction
        ) / LAMPORTS_PER_SOL
        future_sol = (epoch_rent_sol + network_fee_sol) * self.safety_multiplier
        offchain_quote = 60 * self.yearly_offchain_quote
        required_quote = future_sol * self.quote_per_sol + offchain_quote
        gross_quote = self.sold_heli * self.average_quote_per_heli
        return {
            "pre_sale_sol_estimate": round(pre_sale_sol, 6),
            "future_epoch_rent_sol": round(epoch_rent_sol, 6),
            "future_network_fee_sol": round(network_fee_sol, 6),
            "future_sol_with_buffer": round(future_sol, 6),
            "future_offchain_quote": round(offchain_quote, 6),
            "sale_proceeds_quote": round(gross_quote, 6),
            "reserve_needed_quote": round(required_quote, 6),
            "sale_coverage_ratio": round(gross_quote / required_quote, 4) if required_quote else None,
            "self_funded_after_sale": gross_quote >= required_quote,
            "minimum_average_quote_per_heli": round(required_quote / self.sold_heli, 9) if self.sold_heli else None,
        }


if __name__ == "__main__":
    import argparse, json
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("--program-bytes", type=int, default=949_336)
    p.add_argument("--sold-heli", type=int, required=True)
    p.add_argument("--average-quote-per-heli", type=float, required=True)
    p.add_argument("--quote-per-sol", type=float, required=True)
    p.add_argument("--setup-extra-sol", type=float, default=0)
    p.add_argument("--yearly-offchain-quote", type=float, default=0)
    p.add_argument("--priority-fee-lamports", type=int, default=0)
    a = p.parse_args()
    print(json.dumps(Budget(
        program_bytes=a.program_bytes, sold_heli=a.sold_heli,
        average_quote_per_heli=a.average_quote_per_heli,
        quote_per_sol=a.quote_per_sol, setup_extra_sol=a.setup_extra_sol,
        yearly_offchain_quote=a.yearly_offchain_quote,
        priority_fee_lamports_per_transaction=a.priority_fee_lamports,
    ).calculate(), indent=2))
