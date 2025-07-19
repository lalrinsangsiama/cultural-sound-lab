"""
Environment variable validation for Cultural Sound Lab AI Service.
"""
import os
import sys
import logging
from typing import Dict, Any, Optional, List
from pathlib import Path
from urllib.parse import urlparse
import redis
import psycopg2
from pydantic import BaseSettings, validator, AnyUrl, Field
from enum import Enum

logger = logging.getLogger(__name__)

class LogLevel(str, Enum):
    DEBUG = "debug"
    INFO = "info"
    WARNING = "warning"
    ERROR = "error"
    CRITICAL = "critical"

class Environment(str, Enum):
    DEVELOPMENT = "development"
    STAGING = "staging"
    PRODUCTION = "production"
    TESTING = "testing"

class StorageProvider(str, Enum):
    MINIO = "minio"
    S3 = "s3"
    LOCAL = "local"

class DeviceType(str, Enum):
    AUTO = "auto"
    CPU = "cpu"
    CUDA = "cuda"
    MPS = "mps"

class ModelSize(str, Enum):
    SMALL = "small"
    MEDIUM = "medium"
    LARGE = "large"

class AIServiceConfig(BaseSettings):
    """AI Service configuration with validation."""
    
    # Service Configuration
    port: int = Field(default=8000, ge=1000, le=65535)
    host: str = Field(default="0.0.0.0")
    api_version: str = Field(default="v1")
    service_name: str = Field(default="cultural-sound-lab-ai")
    environment: Environment = Field(default=Environment.DEVELOPMENT)
    
    # API Security
    api_key: Optional[str] = Field(default=None, min_length=32)
    jwt_secret: Optional[str] = Field(default=None, min_length=32)
    allowed_origins: str = Field(default="http://localhost:3001,http://localhost:3000")
    cors_enabled: bool = Field(default=True)
    
    # AI Models Configuration
    audiocraft_model_path: str = Field(default="/models/audiocraft/musicgen-medium")
    audiocraft_cache_dir: str = Field(default="/cache/audiocraft")
    audiocraft_model_size: ModelSize = Field(default=ModelSize.MEDIUM)
    audiocraft_max_length: int = Field(default=30, ge=3, le=300)
    audiocraft_sample_rate: int = Field(default=32000, ge=16000, le=48000)
    
    demucs_model_path: str = Field(default="/models/demucs/htdemucs")
    demucs_cache_dir: str = Field(default="/cache/demucs")
    demucs_device: DeviceType = Field(default=DeviceType.AUTO)
    demucs_shifts: int = Field(default=1, ge=1, le=10)
    demucs_split: bool = Field(default=True)
    
    # Custom Models
    style_transfer_model_path: str = Field(default="/models/custom/style_transfer")
    cultural_classifier_model_path: str = Field(default="/models/custom/cultural_classifier")
    mood_classifier_model_path: str = Field(default="/models/custom/mood_classifier")
    
    # Hardware Configuration
    device: DeviceType = Field(default=DeviceType.AUTO)
    cuda_visible_devices: str = Field(default="0")
    torch_num_threads: int = Field(default=4, ge=1, le=32)
    omp_num_threads: int = Field(default=4, ge=1, le=32)
    mkl_num_threads: int = Field(default=4, ge=1, le=32)
    
    # Memory Management
    max_memory_usage: str = Field(default="8GB")
    batch_size: int = Field(default=1, ge=1, le=16)
    max_concurrent_generations: int = Field(default=3, ge=1, le=10)
    model_cache_size: int = Field(default=2, ge=1, le=10)
    clear_cache_interval: int = Field(default=3600, ge=300)
    
    # File Processing
    input_audio_formats: str = Field(default="mp3,wav,m4a,flac,ogg")
    output_audio_format: str = Field(default="mp3")
    output_sample_rate: int = Field(default=44100, ge=16000, le=96000)
    output_bit_rate: str = Field(default="320k")
    max_file_size: str = Field(default="100MB")
    temp_dir: str = Field(default="/tmp/ai_processing")
    cleanup_temp_files: bool = Field(default=True)
    
    # Generation Parameters
    default_generation_length: int = Field(default=30, ge=3, le=300)
    max_generation_length: int = Field(default=300, ge=10, le=600)
    min_generation_length: int = Field(default=3, ge=1, le=10)
    default_temperature: float = Field(default=0.8, ge=0.1, le=2.0)
    default_top_k: int = Field(default=250, ge=1, le=1000)
    default_top_p: float = Field(default=0.0, ge=0.0, le=1.0)
    
    # Queue Configuration
    redis_url: str = Field(default="redis://localhost:6379")
    queue_name: str = Field(default="ai_generation_queue")
    max_queue_size: int = Field(default=100, ge=10, le=1000)
    job_timeout: int = Field(default=600, ge=60, le=3600)
    result_ttl: int = Field(default=3600, ge=300, le=86400)
    failed_job_ttl: int = Field(default=86400, ge=3600)
    
    # Storage Configuration
    storage_provider: StorageProvider = Field(default=StorageProvider.MINIO)
    minio_endpoint: str = Field(default="localhost:9000")
    minio_access_key: str = Field(default="minioadmin")
    minio_secret_key: str = Field(default="minioadmin")
    minio_bucket_input: str = Field(default="ai-input")
    minio_bucket_output: str = Field(default="ai-output")
    minio_use_ssl: bool = Field(default=False)
    
    # AWS S3 Configuration
    aws_access_key_id: Optional[str] = Field(default=None)
    aws_secret_access_key: Optional[str] = Field(default=None)
    aws_region: str = Field(default="us-east-1")
    aws_s3_bucket_input: str = Field(default="ai-input-prod")
    aws_s3_bucket_output: str = Field(default="ai-output-prod")
    
    # Database Configuration
    database_url: Optional[str] = Field(default=None)
    db_pool_size: int = Field(default=5, ge=1, le=20)
    db_timeout: int = Field(default=30, ge=5, le=60)
    
    # Monitoring & Logging
    log_level: LogLevel = Field(default=LogLevel.INFO)
    log_format: str = Field(default="json")
    sentry_dsn: Optional[AnyUrl] = Field(default=None)
    prometheus_enabled: bool = Field(default=True)
    prometheus_port: int = Field(default=9090, ge=1000, le=65535)
    metrics_endpoint: str = Field(default="/metrics")
    
    # Performance Monitoring
    enable_profiling: bool = Field(default=False)
    profiling_output_dir: str = Field(default="/profiling")
    benchmark_mode: bool = Field(default=False)
    performance_logging: bool = Field(default=True)
    
    # Cultural Context
    cultural_metadata_path: str = Field(default="/data/cultural_metadata")
    cultural_validation_enabled: bool = Field(default=True)
    cultural_approval_required: bool = Field(default=True)
    restricted_cultural_contexts: str = Field(default="sacred,ceremonial")
    
    # Rate Limiting
    rate_limit_requests_per_minute: int = Field(default=10, ge=1, le=100)
    rate_limit_requests_per_hour: int = Field(default=100, ge=10, le=1000)
    rate_limit_requests_per_day: int = Field(default=1000, ge=100, le=10000)
    
    # Feature Flags
    enable_style_transfer: bool = Field(default=True)
    enable_mood_generation: bool = Field(default=True)
    enable_instrument_separation: bool = Field(default=True)
    enable_cultural_classification: bool = Field(default=True)
    enable_batch_processing: bool = Field(default=False)
    enable_real_time_generation: bool = Field(default=False)
    
    # Security
    disable_telemetry: bool = Field(default=True)
    sandbox_enabled: bool = Field(default=True)
    max_cpu_usage: int = Field(default=80, ge=10, le=100)
    max_disk_usage: str = Field(default="10GB")
    network_timeout: int = Field(default=30, ge=5, le=120)
    
    # Development & Testing
    debug_mode: bool = Field(default=False)
    mock_models: bool = Field(default=False)
    test_mode: bool = Field(default=False)
    benchmark_datasets_path: str = Field(default="/data/benchmarks")
    
    # Model Downloads
    huggingface_cache_dir: str = Field(default="/cache/huggingface")
    huggingface_token: Optional[str] = Field(default=None)
    auto_download_models: bool = Field(default=False)
    model_download_timeout: int = Field(default=3600, ge=300, le=7200)
    
    @validator('allowed_origins')
    def validate_origins(cls, v):
        """Validate CORS origins format."""
        origins = [origin.strip() for origin in v.split(',')]
        for origin in origins:
            if not origin.startswith(('http://', 'https://')):
                raise ValueError(f"Invalid origin format: {origin}")
        return v
    
    @validator('input_audio_formats')
    def validate_audio_formats(cls, v):
        """Validate supported audio formats."""
        formats = [fmt.strip().lower() for fmt in v.split(',')]
        supported_formats = {'mp3', 'wav', 'm4a', 'flac', 'ogg', 'aac'}
        for fmt in formats:
            if fmt not in supported_formats:
                raise ValueError(f"Unsupported audio format: {fmt}")
        return v
    
    @validator('max_file_size', 'max_memory_usage', 'max_disk_usage')
    def validate_size_format(cls, v):
        """Validate size format (e.g., 100MB, 8GB)."""
        import re
        if not re.match(r'^\d+(\.\d+)?(B|KB|MB|GB|TB)$', v, re.IGNORECASE):
            raise ValueError(f"Invalid size format: {v}")
        return v
    
    @validator('redis_url')
    def validate_redis_url(cls, v):
        """Validate Redis URL format."""
        parsed = urlparse(v)
        if parsed.scheme != 'redis':
            raise ValueError("Redis URL must start with 'redis://'")
        return v
    
    @validator('database_url')
    def validate_database_url(cls, v):
        """Validate database URL format."""
        if v is None:
            return v
        parsed = urlparse(v)
        if parsed.scheme not in ['postgresql', 'postgres']:
            raise ValueError("Database URL must use postgresql:// scheme")
        return v
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = False
        
        # Map environment variables to field names
        fields = {
            'port': {'env': 'PORT'},
            'host': {'env': 'HOST'},
            'api_key': {'env': 'API_KEY'},
            'jwt_secret': {'env': 'JWT_SECRET'},
        }

def parse_size_to_bytes(size_str: str) -> int:
    """Convert size string to bytes."""
    import re
    
    units = {
        'B': 1,
        'KB': 1024,
        'MB': 1024 ** 2,
        'GB': 1024 ** 3,
        'TB': 1024 ** 4,
    }
    
    match = re.match(r'^(\d+(?:\.\d+)?)(B|KB|MB|GB|TB)$', size_str, re.IGNORECASE)
    if not match:
        raise ValueError(f"Invalid size format: {size_str}")
    
    value, unit = match.groups()
    return int(float(value) * units[unit.upper()])

def validate_environment() -> AIServiceConfig:
    """Validate environment variables and return configuration."""
    try:
        config = AIServiceConfig()
        
        # Production-specific validation
        if config.environment == Environment.PRODUCTION:
            required_in_prod = []
            
            if not config.api_key:
                required_in_prod.append('API_KEY')
            
            if not config.jwt_secret:
                required_in_prod.append('JWT_SECRET')
            
            if config.storage_provider == StorageProvider.S3:
                if not config.aws_access_key_id or not config.aws_secret_access_key:
                    required_in_prod.extend(['AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY'])
            
            if required_in_prod:
                raise ValueError(f"Missing required environment variables for production: {', '.join(required_in_prod)}")
        
        # Validate paths exist for development
        if config.environment == Environment.DEVELOPMENT:
            required_dirs = [
                config.temp_dir,
                config.audiocraft_cache_dir,
                config.demucs_cache_dir,
            ]
            
            for dir_path in required_dirs:
                Path(dir_path).mkdir(parents=True, exist_ok=True)
        
        # Validate model paths if not in mock mode
        if not config.mock_models:
            model_paths = [
                config.audiocraft_model_path,
                config.demucs_model_path,
            ]
            
            missing_models = []
            for model_path in model_paths:
                if not Path(model_path).exists() and not config.auto_download_models:
                    missing_models.append(model_path)
            
            if missing_models:
                logger.warning(f"Model paths not found: {', '.join(missing_models)}")
                logger.warning("Set AUTO_DOWNLOAD_MODELS=true to download automatically")
        
        # Log configuration
        logger.info("✅ AI service environment validation successful")
        logger.info(f"📊 Running in {config.environment} mode")
        logger.info(f"🧠 Device: {config.device}")
        logger.info(f"💾 Storage provider: {config.storage_provider}")
        
        # Log enabled features
        enabled_features = []
        if config.enable_style_transfer:
            enabled_features.append("style_transfer")
        if config.enable_mood_generation:
            enabled_features.append("mood_generation")
        if config.enable_instrument_separation:
            enabled_features.append("instrument_separation")
        if config.enable_cultural_classification:
            enabled_features.append("cultural_classification")
        
        if enabled_features:
            logger.info(f"🚀 Enabled features: {', '.join(enabled_features)}")
        
        return config
        
    except Exception as e:
        logger.error(f"❌ Environment validation failed: {e}")
        sys.exit(1)

def validate_redis_connection(config: AIServiceConfig) -> bool:
    """Validate Redis connection."""
    try:
        r = redis.from_url(config.redis_url)
        r.ping()
        logger.info("✅ Redis connection validated")
        return True
    except Exception as e:
        logger.warning(f"⚠️  Redis connection failed: {e}")
        return False

def validate_database_connection(config: AIServiceConfig) -> bool:
    """Validate database connection."""
    if not config.database_url:
        logger.info("⚠️  No database configuration found")
        return False
    
    try:
        conn = psycopg2.connect(config.database_url)
        conn.close()
        logger.info("✅ Database connection validated")
        return True
    except Exception as e:
        logger.warning(f"⚠️  Database connection failed: {e}")
        return False

def validate_storage_connection(config: AIServiceConfig) -> bool:
    """Validate storage connection."""
    if config.storage_provider == StorageProvider.MINIO:
        try:
            from minio import Minio
            
            client = Minio(
                config.minio_endpoint,
                access_key=config.minio_access_key,
                secret_key=config.minio_secret_key,
                secure=config.minio_use_ssl
            )
            
            # Test connection
            client.list_buckets()
            logger.info("✅ MinIO connection validated")
            return True
        except Exception as e:
            logger.warning(f"⚠️  MinIO connection failed: {e}")
            return False
    
    elif config.storage_provider == StorageProvider.S3:
        try:
            import boto3
            
            s3 = boto3.client(
                's3',
                aws_access_key_id=config.aws_access_key_id,
                aws_secret_access_key=config.aws_secret_access_key,
                region_name=config.aws_region
            )
            
            # Test connection
            s3.list_buckets()
            logger.info("✅ S3 connection validated")
            return True
        except Exception as e:
            logger.warning(f"⚠️  S3 connection failed: {e}")
            return False
    
    return False

def validate_gpu_availability(config: AIServiceConfig) -> bool:
    """Validate GPU availability if CUDA device is requested."""
    if config.device in [DeviceType.CUDA, DeviceType.AUTO]:
        try:
            import torch
            
            if torch.cuda.is_available():
                gpu_count = torch.cuda.device_count()
                logger.info(f"✅ CUDA available with {gpu_count} GPU(s)")
                
                # Set CUDA device
                os.environ['CUDA_VISIBLE_DEVICES'] = config.cuda_visible_devices
                return True
            else:
                logger.warning("⚠️  CUDA requested but not available, falling back to CPU")
                return False
        except ImportError:
            logger.warning("⚠️  PyTorch not available, cannot check CUDA")
            return False
    
    return True

def run_startup_validation() -> AIServiceConfig:
    """Run comprehensive startup validation."""
    logger.info("🔍 Running AI service startup validation...")
    
    # Validate environment variables
    config = validate_environment()
    
    # Validate connections
    redis_ok = validate_redis_connection(config)
    db_ok = validate_database_connection(config)
    storage_ok = validate_storage_connection(config)
    gpu_ok = validate_gpu_availability(config)
    
    # Summary
    logger.info("✅ AI service startup validation completed")
    logger.info(f"📊 Connection status - Redis: {'✅' if redis_ok else '❌'}, "
                f"DB: {'✅' if db_ok else '❌'}, "
                f"Storage: {'✅' if storage_ok else '❌'}, "
                f"GPU: {'✅' if gpu_ok else '❌'}")
    
    return config

if __name__ == "__main__":
    # Configure logging
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
    )
    
    # Run validation
    config = run_startup_validation()
    print("Environment validation completed successfully!")