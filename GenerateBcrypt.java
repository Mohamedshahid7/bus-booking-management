import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Arrays;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

public class GenerateBcrypt {
    public static void main(String[] args) throws Exception {
        var console = System.console();

        if (console == null) {
            System.out.println("Please run this from PowerShell.");
            return;
        }

        char[] password = console.readPassword("Enter your new operator password: ");

        try {
            String hash = new BCryptPasswordEncoder()
                    .encode(new String(password));

            Files.writeString(
                    Path.of("operator-password-hash.txt"),
                    hash
            );

            System.out.println("BCrypt hash generated successfully!");
        } finally {
            Arrays.fill(password, '\0');
        }
    }
}