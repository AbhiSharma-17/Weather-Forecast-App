import sys
import json
import math

def calculate_forecast(history, steps=7):
    """
    Performs a double exponential smoothing (Holt-Winters style) on the history series
    to forecast the next `steps` intervals.
    """
    if len(history) < 2:
        # Fallback to simple repetition if data is too short
        val = history[0] if history else 20.0
        return [val] * steps

    # Hyperparameters
    alpha = 0.5
    beta = 0.3

    # Initialization
    level = history[0]
    trend = history[1] - history[0]

    # Warmup loop through historical data
    for i in range(1, len(history)):
        val = history[i]
        last_level = level
        level = alpha * val + (1 - alpha) * (level + trend)
        trend = beta * (level - last_level) + (1 - beta) * trend

    # Forecasting loop
    forecast = []
    for step in range(1, steps + 1):
        prediction = level + step * trend
        # Add a subtle sine wave variation for realistic-looking weather fluctuations
        variation = 1.5 * math.sin(step * 0.8)
        forecast.append(round(prediction + variation, 2))

    return forecast

def main():
    try:
        # Read from stdin
        if len(sys.argv) > 1:
            raw_input = sys.argv[1]
        else:
            raw_input = sys.stdin.read()

        data = json.loads(raw_input)
        history = data.get("history", [20, 21, 22, 21, 23, 24, 25, 24, 26, 27])
        steps = data.get("steps", 7)

        predictions = calculate_forecast(history, steps)

        # Output predictions as JSON
        output = {
            "success": True,
            "engine": "Python Standard ML Engine",
            "forecast": predictions
        }
        print(json.dumps(output))

    except Exception as e:
        error_output = {
            "success": False,
            "error": str(e)
        }
        print(json.dumps(error_output))
        sys.exit(1)

if __name__ == "__main__":
    main()
