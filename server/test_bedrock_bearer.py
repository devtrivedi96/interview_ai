import boto3
import json

# Region
region = "us-east-1"

# Create Bedrock client
client = boto3.client(
    service_name="bedrock-runtime",
    region_name=region
)

# Model ID (latest recommended)
model_id = "anthropic.claude-3-haiku-20240307-v1:0"

# Payload (Claude 3 format)
payload = {
    "anthropic_version": "bedrock-2023-05-31",
    "max_tokens": 100,
    "temperature": 0.6,
    "messages": [
        {
            "role": "user",
            "content": "Hello, Bedrock!"
        }
    ]
}

try:
    response = client.invoke_model(
        modelId=model_id,
        body=json.dumps(payload),
        contentType="application/json",
        accept="application/json"
    )

    result = json.loads(response["body"].read())

    print("Response:")
    print(result["content"][0]["text"])

except Exception as e:
    print("Error:", str(e))