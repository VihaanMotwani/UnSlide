# UnSlide 🎓

**The textbook your professor forgot to write.**

[![License](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![Status](https://img.shields.io/badge/Status-Beta-orange)]()

UnSlide is an AI-powered platform that bridges the gap between cryptic professor slides and comprehensive textbooks. It ingests PDF/PPTX slides and uses advanced LLMs to generate rich, context-aware narratives, effectively "teaching" the content that was missing from the bullet points.

---

## 🎥 Demo

[![UnSlide Demo](https://img.youtube.com/vi/23dKWoj3lqo/0.jpg)](https://youtu.be/23dKWoj3lqo)

*(Watch the video above to see UnSlide in action)*

---

## 🚀 Key Features

- **📄 Slide Ingestion**: Upload your lecture slides (PDF support).
- **🧠 AI Expansion**: Automatically converts bullet points into full, didactic explanations.
- **👀 Split-View Interface**: Study the original slide alongside the generated "textbook" content.
- **🔗 Contextual Resources**: Auto-suggested readings, videos, and definitions to deepen understanding.
- **💾 Export**: Save your enhanced study guide as a PDF.

## 🛠️ Tech Stack

- **Frontend**: [Next.js](https://nextjs.org/), [React](https://reactjs.org/), [Tailwind CSS](https://tailwindcss.com/), [TypeScript](https://www.typescriptlang.org/)
- **Backend**: [FastAPI](https://fastapi.tiangolo.com/), Python
- **AI/ML**: Large Language Models (Gemini/OpenAI) for text generation and reasoning.

## 🏁 Getting Started

Follow these instructions to set up the project locally.

### Prerequisites

- **Node.js** (v18 or higher)
- **Python** (v3.10 or higher)
- **Git**

### Installation

1.  **Clone the repository**
    ```bash
    git clone https://github.com/VihaanMotwani/UnSlide.git
    cd UnSlide
    ```

2.  **Environment Setup**
    
    Create a `.env` file in the `backend` directory with your API keys:
    ```bash
    # backend/.env
    GOOGLE_API_KEY=your_google_api_key
    # OR
    OPENAI_API_KEY=your_openai_api_key
    ```

3.  **Run the Application**

    We provide a convenience script to start both the backend and frontend:

    ```bash
    chmod +x dev.sh
    ./dev.sh
    ```

    **Or run them manually:**

    *Backend:*
    ```bash
    cd backend
    python3 -m venv venv
    source venv/bin/activate
    pip install -r requirements.txt
    uvicorn main:app --reload --port 8000
    ```

    *Frontend:*
    ```bash
    cd frontend
    npm install
    npm run dev
    ```

4.  **Access the App**
    Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📖 Usage

1.  **Upload**: Drag and drop your lecture PDF on the home screen.
2.  **Process**: Wait for the AI to analyze and expand the content.
3.  **Study**: Use the split-view interface to read the generated explanations while referencing the original slides.
4.  **Export**: Click the download button to save your notes.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1.  Fork the project
2.  Create your feature branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request

## 📄 License

This project is licensed under the Apache License 2.0 - see the [LICENSE](LICENSE) file for details.

---

*Built with ❤️ for students everywhere.*