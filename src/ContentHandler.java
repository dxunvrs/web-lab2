import com.fastcgi.FCGIInterface;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.util.Map;

public class ContentHandler {
    private static final String UPLOAD_DIR = "content";

    static {
        File dir = new File(UPLOAD_DIR);
        if (!dir.exists()) {
            dir.mkdir();
        }
    }

    public static void handle(Map<String, String> params) {
        String type = params.getOrDefault("type", "photo");

        String lengthStr = FCGIInterface.request.params.getProperty("CONTENT_LENGTH");
        int contentLength = 0;

        try {
            if (lengthStr != null && !lengthStr.isBlank()) {
                contentLength = Integer.parseInt(lengthStr);
            }
        } catch (NumberFormatException e) {
            sendError("Некорректная длина");
            return;
        }

        if (contentLength <= 0) {
            sendError("Нет контента для сохранения");
            return;
        }

        try {
            byte[] body = System.in.readNBytes(contentLength);

            String ext = "video".equalsIgnoreCase(type) ? ".webm" : ".jpg";
            String filename = type + "_" + System.currentTimeMillis() + ext;
            File targetFile = new File(UPLOAD_DIR, filename);

            try (FileOutputStream fileOutputStream = new FileOutputStream(targetFile)) {
                fileOutputStream.write(body);
            }

            String jsonResponse = """
                    {
                        "status": "ok",
                        "message": "Нарушитель зафиксирован",
                        "file": "%s"
                    }
                    """.formatted(filename);
            sendResponse(jsonResponse);
        } catch (IOException e) {
            sendError("Ошибка при сохранении: " + e.getMessage());
        }
    }

    private static void sendError(String message) {
        String jsonResponse = """
                    {
                        "status": "error",
                        "message": "%s"
                    }
                    """.formatted(message);
        sendResponse(jsonResponse);
    }

    private static void sendResponse(String json) {
        System.out.println("Content-Type: application/json; charset=utf-8\n");
        System.out.println(json);
    }
}
