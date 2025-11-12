#include <stdio.h>

int main() {
    FILE *file = fopen("output.txt", "w");
    if (file == NULL) {
        printf("Could not create file\n");
        return 1;
    }
    
    fprintf(file, "Hello from C!\n");
    fclose(file);
    
    printf("File written successfully\n");
    return 0;
}

