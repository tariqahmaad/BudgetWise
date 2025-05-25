# BudgetWise

BudgetWise is a mobile application designed to help users manage their finances effectively. It offers features for tracking expenses and income, setting budgets, visualizing financial data, and more, with an intuitive user interface. The app also integrates AI-powered features to provide smarter financial insights.

## ✨ Features

*   **Expense & Income Tracking:** Easily log your daily transactions.
*   **Budget Management:** Create and manage budgets for different categories.
*   **Data Visualization:** Understand your spending habits with interactive charts and graphs (via `react-native-chart-kit`).
*   **User Authentication:** Secure login and registration using Firebase.
*   **Onboarding:** A smooth onboarding experience for new users.
*   **AI-Powered Insights:** (Describe the AI features, e.g., "Smart suggestions for budget optimization," "Automated transaction categorization," etc. - leveraging `@google/genai`)
*   **Category Management:** Organize transactions with customizable categories.
*   **(Potentially) Social Features:** (If `FriendCards/` implies sharing, describe here, e.g., "Share budgets or track group expenses with friends.")
*   **Document Management:** Attach documents to transactions (via `expo-document-picker`).
*   **Customizable UI:** Light theme, haptic feedback, custom fonts.

## 🛠️ Tech Stack

*   **Frontend:** React Native, Expo
*   **Navigation:** React Navigation (Bottom Tabs, Native Stack)
*   **Backend & Database:** Firebase (Authentication, Firestore/Realtime Database)
*   **Charting:** `react-native-chart-kit`
*   **AI Integration:** Google Generative AI (`@google/genai`)
*   **Local Storage:** `@react-native-async-storage/async-storage`
*   **UI Libraries & Components:**
    *   `expo-blur`
    *   `expo-linear-gradient`
    *   `react-native-modal`
    *   `react-native-vector-icons`
    *   `react-native-onboarding-swiper`
    *   `react-native-markdown-display`
*   **Utilities:** `date-fns`, `expo-file-system`, `expo-haptics`, `expo-image-manipulator`

## 🚀 Getting Started

### Prerequisites

*   Node.js (LTS version recommended)
*   Yarn or npm
*   Expo CLI: `npm install -g expo-cli`
*   A Firebase project set up. You will need to configure your Firebase credentials in the project. (Provide details on where to add firebase config, e.g., `firebase/firebaseConfig.js` - create this file if it doesn't exist and add it to `.gitignore`)

### Installation & Setup

1.  **Clone the repository:**

    ```bash
    git clone https://github.com/tariqahmaad/BudgetWise
    cd budgetwise
    ```

2.  **Install dependencies:**

    ```bash
    npm install
    # or
    yarn install
    ```

3.  **Configure Firebase:**

    *   Create a `firebase/firebaseConfig.js` file (if it doesn't exist).

    *   Add your Firebase project configuration details to this file. It should look something like this:

        ```javascript
        // firebase/firebaseConfig.js
        const firebaseConfig = {
          apiKey: "YOUR_API_KEY",
          authDomain: "YOUR_AUTH_DOMAIN",
          projectId: "YOUR_PROJECT_ID",
          storageBucket: "YOUR_STORAGE_BUCKET",
          messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
          appId: "YOUR_APP_ID",
          measurementId: "YOUR_MEASUREMENT_ID" // Optional
        };
        
        export default firebaseConfig;
        ```

    *   Ensure this file is listed in your `.gitignore` to keep credentials private.

4.  **(Optional) Environment Variables:**

    *   If you use environment variables (e.g., for API keys other than Firebase), create a `.env` file in the root directory and add them there.

    *   Example `.env` file:

        ```
        GOOGLE_GENAI_API_KEY=YOUR_GOOGLE_GENAI_KEY
        ```

    *   Make sure `.env` is in your `.gitignore`.

### Running the Application

*   **Start the development server:**

    ```bash
    npm start
    # or
    yarn start
    ```

    This will open the Expo Developer Tools in your browser.

*   **Run on an Android device/emulator:**
    Scan the QR code with the Expo Go app on your Android device, or press `a` in the terminal if an emulator is running.

    ```bash
    npm run android
    # or
    yarn android
    ```

*   **Run on an iOS simulator/device:**
    Scan the QR code with the Expo Go app on your iOS device, or press `i` in the terminal if a simulator is running (macOS only).

    ```bash
    npm run ios
    # or
    yarn ios
    ```

*   **Run in a web browser:**

    ```bash
    npm run web
    # or
    yarn web
    ```

## 🤝 Contributing

[![Contributors](https://contrib.rocks/image?repo=tariqahmaad/budgetwise)](https://github.com/tariqahmaad/budgetwise/graphs/contributors)

Tariq Ahmad - [Developer](https://github.com/tariqahmaad) 

Mohammad Rauf - [Developer](https://github.com/mohammadrauf0) 

Dania Ayad - [Developer](https://github.com/Cactuskiller)



