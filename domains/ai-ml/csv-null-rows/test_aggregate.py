import unittest
from pathlib import Path

from aggregate import average_by_student, load_rows

FIXTURE = Path(__file__).with_name("scores.csv")


class AverageByStudentTest(unittest.TestCase):
    def setUp(self):
        self.rows = load_rows(FIXTURE)

    def test_blank_scores_do_not_lower_a_students_average(self):
        averages = average_by_student(self.rows)
        self.assertEqual(averages["aarav"], 80.0)

    def test_numeric_scores_are_averaged_normally(self):
        averages = average_by_student(self.rows)
        self.assertEqual(averages["meera"], 90.0)

    def test_student_with_only_blank_scores_is_omitted(self):
        averages = average_by_student(self.rows)
        self.assertNotIn("ishaan", averages)

    def test_whitespace_around_a_score_is_ignored(self):
        rows = [
            {"student": "noor", "score": " 70 "},
            {"student": "noor", "score": "90"},
        ]
        self.assertEqual(average_by_student(rows)["noor"], 80.0)

    def test_non_numeric_score_is_not_silently_zero(self):
        with self.assertRaises(ValueError):
            average_by_student([{"student": "dev", "score": "eighty"}])

    def test_missing_student_name_is_skipped(self):
        rows = [{"student": "", "score": "99"}, {"student": "zoya", "score": "50"}]
        self.assertEqual(average_by_student(rows), {"zoya": 50.0})


if __name__ == "__main__":
    unittest.main()
