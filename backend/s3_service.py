import boto3
import os
import uuid
from botocore.exceptions import ClientError

def get_s3_client():
    return boto3.client(
        "s3",
        region_name=os.getenv("AWS_REGION", "us-east-1"),
        aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID", "testing"),
        aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY", "testing"),
        aws_session_token=os.getenv("AWS_SESSION_TOKEN", "testing"),
    )

def create_presigned_upload_url(file_type: str) -> dict | None:
    bucket_name = os.getenv("S3_BUCKET_NAME")
    if not bucket_name:
        return None

    s3_client = get_s3_client()
    object_name = f"uploads/{uuid.uuid4()}.{file_type.split('/')[-1]}"

    try:
        return s3_client.generate_presigned_post(
            Bucket=bucket_name,
            Key=object_name,
            Fields={"Content-Type": file_type},
            Conditions=[{"Content-Type": file_type}],
            ExpiresIn=3600
        )
    except Exception:
        return None