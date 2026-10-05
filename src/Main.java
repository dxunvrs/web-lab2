import com.fastcgi.FCGIInterface;

import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.Locale;
import java.util.Map;

public class Main {
    public static void main(String[] args) {
        FCGIInterface fcgiInterface = new FCGIInterface();
        DateTimeFormatter dateTimeFormatter = DateTimeFormatter.ofPattern("HH:mm:ss dd.MM.yyyy");

        while (fcgiInterface.FCGIaccept() >= 0) {
            if (FCGIInterface.request == null) {
                continue;
            }

            long startTime = System.nanoTime();

            String method = FCGIInterface.request.params.getProperty("REQUEST_METHOD");
            if (!method.equalsIgnoreCase("GET")) {
                sendError(String.format("Метод %s не поддерживается", method));
                continue;
            }

            String queryString = FCGIInterface.request.params.getProperty("QUERY_STRING");
            Map<String, String> params = getParams(queryString);

            Validator validator = new Validator(params.getOrDefault("x", null),
                    params.getOrDefault("y", null),
                    params.getOrDefault("r", null));
            validator.validate();

            if (validator.isValid()) {
                boolean hit = validator.checkHit();
                long executionTime = System.nanoTime() - startTime;
                String currentTime = LocalDateTime.now().format(dateTimeFormatter);

                sendOk(hit, String.format(Locale.US, "%.3f", executionTime / 1_000_000.0), currentTime);
            } else {
                sendError(validator.getErrorMessage());
            }
        }
    }

    private static void sendOk(boolean hit, String executionTime, String currentTime) {
        String jsonResponse = """
                    {
                        "status": "ok",
                        "hit": %b,
                        "executionTime": "%s",
                        "serverTime": "%s"
                    }
                    """.formatted(hit, executionTime, currentTime);
        sendResponse(jsonResponse);
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

    private static Map<String, String> getParams(String queryString) {
        Map<String, String> params = new HashMap<>();
        if (queryString == null || queryString.isEmpty()) {
            return params;
        }
        String[] pairs = queryString.split("&");
        for (String pair: pairs) {
            int idx = pair.indexOf("=");
            String key;
            String value;
            if (idx > 0) {
                key = URLDecoder.decode(pair.substring(0, idx), StandardCharsets.UTF_8);
                value = URLDecoder.decode(pair.substring(idx + 1), StandardCharsets.UTF_8);
            } else {
                key = URLDecoder.decode(pair, StandardCharsets.UTF_8);
                value = "";
            }
            params.put(key, value);
        }
        return params;
    }
}
