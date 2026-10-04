import unittest
from budget import Budget


class BudgetTests(unittest.TestCase):
    def scenario(self, **kwargs):
        return Budget(program_bytes=949_336, sold_heli=1_000_000,
                      average_quote_per_heli=0.001, quote_per_sol=100,
                      **kwargs).calculate()

    def test_base_costs_and_coverage(self):
        r = self.scenario()
        self.assertAlmostEqual(r["pre_sale_sol_estimate"], 6.608583, places=5)
        self.assertAlmostEqual(r["future_epoch_rent_sol"], 4.25952)
        self.assertAlmostEqual(r["future_network_fee_sol"], 0.0108)
        self.assertTrue(r["self_funded_after_sale"])

    def test_zero_sales_cannot_fund_future(self):
        r = Budget(949_336, 0, 0.001, 100).calculate()
        self.assertFalse(r["self_funded_after_sale"])
        self.assertEqual(r["sale_proceeds_quote"], 0)
        self.assertIsNone(r["minimum_average_quote_per_heli"])

    def test_offchain_work_can_dominate_network_cost(self):
        r = self.scenario(yearly_offchain_quote=100)
        self.assertFalse(r["self_funded_after_sale"])
        self.assertEqual(r["future_offchain_quote"], 6000)

    def test_higher_priority_fee_increases_required_reserve(self):
        a = self.scenario()
        b = self.scenario(priority_fee_lamports_per_transaction=100_000)
        self.assertGreater(b["reserve_needed_quote"], a["reserve_needed_quote"])

    def test_never_fabricates_zero_cost(self):
        with self.assertRaises(ValueError):
            Budget(949_336, 1, 0.001, 0).calculate()


if __name__ == "__main__":
    unittest.main()
