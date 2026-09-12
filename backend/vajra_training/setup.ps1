# setup.ps1
# This script installs PyTorch with CUDA 12.1 support and Unsloth for fast 6GB GPU fine-tuning.

Write-Host "Installing PyTorch with CUDA 12.1..." -ForegroundColor Green
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu121

Write-Host "Installing Unsloth and dependencies..." -ForegroundColor Green
# Unsloth dependencies
pip install "unsloth[colab-new] @ git+https://github.com/unslothai/unsloth.git"
pip install --no-deps "trl<0.9.0" peft accelerate bitsandbytes

Write-Host "Installing data processing libraries..." -ForegroundColor Green
pip install pandas pymupdf requests

Write-Host "Setup Complete! Your environment is ready for Unsloth QLoRA fine-tuning." -ForegroundColor Cyan
