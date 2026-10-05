import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Map;
import java.util.Set;

public class Validator {
    private final String xString;
    private final String yString;
    private final String rString;

    private BigDecimal x;
    private BigDecimal y;
    private BigDecimal r;

    private boolean isValid = false;
    private String errorMessage;

    private static final Map<String, BigDecimal> CONST_VALUES = Map.of(
            "-5", new BigDecimal("-5"),
            "-3", new BigDecimal("-3"),
            "0.5", new BigDecimal("0.5"),
            "3", new BigDecimal("3"),
            "5", new BigDecimal("5")
            );

    private static final Set<BigDecimal> ALLOWED_R = Set.of(
            new BigDecimal("1"),
            new BigDecimal("1.5"),
            new BigDecimal("2"),
            new BigDecimal("2.5"),
            new BigDecimal("3")
        );

    public Validator(String xString, String yString, String rString) {
        this.xString = xString;
        this.yString = yString;
        this.rString = rString;
    }

    public void validate() {
        if (xString == null || yString == null || rString == null) {
            isValid = false;
            errorMessage = "Должны быть переданы все параметры";
            return;
        }

        try {
            x = new BigDecimal(xString.replace(',', '.').trim());
            y = new BigDecimal(yString.replace(',', '.').trim());
            r = new BigDecimal(rString.replace(',', '.').trim());

            if (x.compareTo(CONST_VALUES.get("-3")) <= 0 || x.compareTo(CONST_VALUES.get("5")) >= 0) {
                isValid = false;
                errorMessage = "Число X должно строго принадлежать интервалу от -3 до 5";
                return;
            }

            if (y.compareTo(CONST_VALUES.get("-5")) <= 0 || y.compareTo(CONST_VALUES.get("5")) >= 0) {
                isValid = false;
                errorMessage = "Число Y должно строго принадлежать интервалу от -5 до 5";
                return;
            }

            boolean isValidR = ALLOWED_R.stream().anyMatch(bigDecimal -> bigDecimal.compareTo(r) == 0);
            if (!isValidR) {
                isValid = false;
                errorMessage = "Недопустимое значение радиуса";
                return;
            }

            isValid = true;

        } catch (NumberFormatException e) {
            isValid = false;
            errorMessage = "Переданы некорректные параметры";
        }
    }

    public boolean checkHit() {
        BigDecimal zero = BigDecimal.ZERO;
        BigDecimal halfR = r.multiply(CONST_VALUES.get("0.5"));
        BigDecimal halfX = x.multiply(CONST_VALUES.get("0.5"));
        BigDecimal squareX = x.pow(2);
        BigDecimal squareY = y.pow(2);
        BigDecimal squareR = r.pow(2);
        if (x.compareTo(zero) >= 0 && y.compareTo(zero) >= 0) {
            return x.compareTo(r) <= 0 && y.compareTo(halfR) <= 0;
        }
        if (x.compareTo(zero) <= 0 && y.compareTo(zero) >= 0) {
            return y.compareTo(halfR.add(halfX)) <= 0;
        }
        if (x.compareTo(zero) <= 0 && y.compareTo(zero) <= 0) {
            return squareX.add(squareY).compareTo(squareR) <= 0;
        }
        return false;
    }

    public String getErrorMessage() {
        return errorMessage;
    }

    public boolean isValid() {
        return isValid;
    }
}
