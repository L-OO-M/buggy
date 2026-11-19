#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <time.h>

#define STRINGSIZE 12

int main() {
  const char chars[] = "abcdefghijklmnopqrstuvwxyz"
                       "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
                       "0123456789";

  size_t charset_size = sizeof(chars) - 1;

  srand(time(NULL));

  char pass[STRINGSIZE + 1];

  for (int i = 0; i < STRINGSIZE; ++i) {
    pass[i] = chars[rand() % charset_size];
  }

  pass[STRINGSIZE] = '\0';

  char input[STRINGSIZE + 2];

  printf("Find the password to pass this level!\n");

  while (1) {
    printf("Password: ");

    if (fgets(input, sizeof(input), stdin) == NULL)
      break;

    input[strcspn(input, "\n")] = '\0';

    if (strcmp(input, pass) == 0) {
      printf("Correct! Level passed.\n");
      break;
    }

    printf("Incorrect password.\n");
  }

  return EXIT_SUCCESS;
}
