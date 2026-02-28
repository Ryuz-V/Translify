# Translify

Translify is a modern, free online translation web application that allows you to translate text and documents seamlessly between multiple languages. Built with a sleek user interface and powered by the open-source LibreTranslate API, Translify provides a fast and reliable translation experience.

## ✨ Features

- **Text Translation**: Instantly translate text across more than 100 languages.
- **Document Translation**: Upload and translate documents (`.txt`, `.pdf`, `.docx`) while preserving formatting.
- **Voice Input (Speech-to-Text)**: Speak directly into the microphone to input text for translation using the Web Speech API.
- **Text-to-Speech (TTS)**: Listen to both the original text and the translated output.
- **Customizable Voice Speed**: Adjust the text-to-speech reading speed directly from the settings menu.
- **Responsive UI**: A beautiful, modern interface built with Tailwind CSS that works on both desktop and mobile devices.

## 🚀 Tech Stack

- **Frontend**: HTML5, Vanilla JavaScript, Tailwind CSS v4.
- **Backend**: Node.js, Express.js.
- **API Integration**: Axios for querying the translation engine.
- **Translation Engine**: [LibreTranslate](https://github.com/LibreTranslate/LibreTranslate) (can be run locally or proxy to a public instance).
- **File Handling**: Multer & Form-Data for handling document uploads.

## 🛠️ Prerequisites

Before you begin, ensure you have met the following requirements:
- **Node.js**: Ensure you have Node.js installed (v16.x or newer is recommended).
- **npm**: Node package manager.
- **LibreTranslate**: A running instance of LibreTranslate. You can host it locally (typically runs on port 5000) or use a hosted instance.

## 📦 Installation & Setup

1. **Clone the repository** (if you haven't already):
   ```bash
   git clone <repository-url>
   cd Translify
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Create a `.env` file in the root directory (if it doesn't exist) and configure your LibreTranslate API URL and API Key (if required):
   ```env
   PORT=3001
   LIBRETRANSLATE_URL=http://localhost:5000
   LIBRETRANSLATE_API_KEY=your_api_key_here_if_needed
   ```

4. **Compile Tailwind CSS** (Optional, if making UI changes):
   ```bash
   npm run build:css
   # OR watch for changes:
   npm run watch:css
   ```

5. **Start the Application**:
   For production:
   ```bash
   npm start
   ```
   For development (auto-reloads on file changes using nodemon):
   ```bash
   npm run dev
   ```

6. **Access the App**:
   Open your browser and navigate to `http://localhost:3001`.

## 📂 Project Structure

```text
Translify/
├── src/
│   ├── css/          # Custom CSS stylesheets
│   ├── js/           # Frontend JavaScript logic (index.js)
│   ├── index.html    # Main HTML application
│   └── input.css     # Tailwind CSS input file
├── asset/            # Image assets and icons
├── server.js         # Express backend proxy server
├── output.css        # Compiled Tailwind CSS
├── package.json      # Node.js dependencies and scripts
└── .env              # Environment configurations
```

## 📝 License

This project is licensed under the ISC License. See the `LICENSE` file for details.
