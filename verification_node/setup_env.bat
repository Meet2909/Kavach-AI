@echo off
echo Setting up the Verification Node Environment for QLoRA Training on 6GB GPU
echo ========================================================================

REM Create a virtual environment
python -m venv venv
call venv\Scripts\activate.bat

REM Upgrade pip
python -m pip install --upgrade pip

REM Install PyTorch with CUDA 12.1 support
echo Installing PyTorch with CUDA 12.1...
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu121

REM Install Unsloth (Crucial for 6GB VRAM training)
echo Installing Unsloth for optimized QLoRA...
pip install "unsloth[colab-new] @ git+https://github.com/unslothai/unsloth.git"

REM Install other dependencies
echo Installing other required packages...
pip install --no-deps trl peft accelerate bitsandbytes
pip install fastapi uvicorn pydantic

echo ========================================================================
echo Environment setup complete! 
echo Run 'venv\Scripts\activate.bat' to activate the environment before running any scripts.
pause
