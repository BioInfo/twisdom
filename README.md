<div align="center">

# Twisdom

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.0-blue.svg)](https://reactjs.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Latest-green.svg)](https://supabase.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.0-blueviolet.svg)](https://tailwindcss.com/)
[![OpenAI](https://img.shields.io/badge/OpenAI-GPT--4-orange.svg)](https://openai.com/)

🚀 An AI-enhanced Twitter bookmark manager that helps you organize, analyze, and get insights from your Twitter bookmarks.

[Features](#features) • [Installation](#installation) • [Documentation](#documentation) • [Contributing](#contributing)

[![Buy Me A Coffee](https://img.shields.io/badge/Buy%20Me%20A%20Coffee-donate-yellow.svg)](https://buymeacoffee.com/JustinHJohnson)

</div>

## Features

- **Import Twitter Bookmarks**: Import your Twitter bookmarks from CSV export
- **AI-Powered Analysis**: Automatic content analysis, summarization, and tagging
- **Collections**: Organize bookmarks into collections and nested folders
- **Tags**: Tag bookmarks and visualize tag relationships
- **Reading Queue**: Prioritize and track your reading progress
- **Insights**: Get analytics and visualizations of your bookmark data
- **Multi-Device Sync**: Access your bookmarks from any device (with Supabase backend)
- **Dark Mode**: Toggle between light and dark themes

## Tech Stack

- **Frontend**: React, TypeScript, Tailwind CSS, Vite
- **Backend**: Supabase (PostgreSQL, Authentication, Storage)
- **AI Integration**: OpenAI GPT-4 for content analysis
- **Data Storage**: Hybrid approach (Supabase when authenticated, localStorage when not)
- **Authentication**: Email/password via Supabase Auth

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase CLI (for local development with backend)
- Docker (for running Supabase locally)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/twisdom.git
   cd twisdom
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env
   ```
   Edit `.env` and add your OpenAI API key and Supabase credentials.

4. Start Supabase locally (optional, for backend development):
   ```bash
   ./scripts/start-supabase.sh
   ```

5. Start the development server:
   ```bash
   npm run dev
   ```

6. Open [http://localhost:5173](http://localhost:5173) in your browser.

## Documentation

Comprehensive documentation is available in the [docs](./docs) directory:

- [Product Requirements Document](./docs/prd.md)
- [Architecture Decisions](./docs/architecture-decisions.md)
- [Supabase Setup](./docs/supabase-setup.md)
- [Active Issues](./docs/active-issues.md)
- [Development Sessions](./docs/sessions)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support the Project

If you find Twisdom useful, consider buying me a coffee! Your support helps maintain and improve the project.

[![Buy Me A Coffee](https://www.buymeacoffee.com/assets/img/custom_images/orange_img.png)](https://buymeacoffee.com/JustinHJohnson)

## About

Developed with ❤️ by [J&S Group, LLC](https://github.com/BioInfo)

## Acknowledgments

- [OpenAI](https://openai.com/) for the GPT-4 API
- [Supabase](https://supabase.com/) for the backend infrastructure
- [React](https://reactjs.org/) for the frontend framework
- [Tailwind CSS](https://tailwindcss.com/) for styling
- [Vite](https://vitejs.dev/) for the build tool