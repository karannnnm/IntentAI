#include <stdio.h>

int main() {
    FILE *file = fopen("test.txt", "r");
    if (file == NULL) {
        printf("Could not open file\n");
        return 1;
    }
    
    char buffer[100];
    fgets(buffer, 100, file);
    printf("Read: %s\n", buffer);
    
    fclose(file);
    return 0;
}

