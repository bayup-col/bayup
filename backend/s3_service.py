import boto3
import os
import uuid
from botocore.client import Config
from botocore.exceptions import ClientError

def get_s3_client():
    # Apunta al endpoint S3-compatible de Supabase Storage (Project Settings > Storage > S3 Connection)
    return boto3.client(
        "s3",
        endpoint_url=os.getenv("SUPABASE_S3_ENDPOINT"),
        region_name=os.getenv("SUPABASE_S3_REGION", "us-east-1"),
        aws_access_key_id=os.getenv("SUPABASE_S3_ACCESS_KEY_ID", "testing"),
        aws_secret_access_key=os.getenv("SUPABASE_S3_SECRET_ACCESS_KEY", "testing"),
        config=Config(s3={"addressing_style": "path"}),
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

def upload_file_and_get_public_url(file_bytes: bytes, content_type: str, filename: str) -> str | None:
    """Sube un archivo directo a Supabase Storage y devuelve su URL publica.
    Requiere que el bucket este configurado como publico en el dashboard de Supabase."""
    bucket_name = os.getenv("S3_BUCKET_NAME")
    endpoint = os.getenv("SUPABASE_S3_ENDPOINT")
    if not bucket_name or not endpoint:
        return None

    extension = filename.rsplit(".", 1)[-1] if "." in filename else content_type.split("/")[-1]
    object_name = f"uploads/{uuid.uuid4()}.{extension}"

    try:
        s3_client = get_s3_client()
        s3_client.put_object(Bucket=bucket_name, Key=object_name, Body=file_bytes, ContentType=content_type)
        base_url = endpoint.replace("/storage/v1/s3", "")
        return f"{base_url}/storage/v1/object/public/{bucket_name}/{object_name}"
    except ClientError:
        return None
