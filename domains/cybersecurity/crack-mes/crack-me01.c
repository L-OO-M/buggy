#include <stdio.h>
#include <stdlib.h>
#include <time.h>

int main() {
  printf("Hello! In order to pass this level, you need to guess a 4-digit "
         "number I'm thinking of.\nYou have infinite tries.\nI will keep "
         "asking until you get it right.\n\n");
  srand(time(NULL));
  int n = rand() % 10000;
  int input = 10000;
  do {
    printf("Password: ");

    if (scanf("%d", &input) != 1) {
      printf("Invalid input! Please enter an integer.\n");

      // Discard the rest of the current input line.
      int c;
      while ((c = getchar()) != '\n' && c != EOF)
        ;
      continue;
    }

  } while (input != n);
  printf("You guessed it right!\nThe password is %d\n", input);
  printf("Level passed!");
  return 0;
}
