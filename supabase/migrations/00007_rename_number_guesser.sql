-- Rename "Number Guesser" to "Crunch It"
UPDATE games
SET name = 'Crunch It',
    description = 'Guess the secret number in each round! Score points and bonus.'
WHERE slug = 'number-guesser';
