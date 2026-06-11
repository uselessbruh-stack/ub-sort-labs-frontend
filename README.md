# UB Sort Labs - Visual Performance Benchmarking Dashboard

UB Sort Labs is an interactive, premium web dashboard that provides real-time benchmarking, visualization, and comparative analysis of sorting algorithms implemented across 7 different programming languages. 

Built using React, Vite, and custom CSS, the dashboard visualizes raw time performance, comparison counts, and swap metrics, translating raw benchmark data from the backend into interactive, readable statistics.

---

## 🖥️ Dashboard Layout & Features

The interface is divided into three core analysis modules, accessible via the navigation bar:

### 1. Algorithms Tab
*   **Purpose**: Test individual sorting algorithms and visualize how a single algorithm behaves with custom inputs.
*   **Features**:
    *   **Algorithm Selector**: Quick access to 11 different algorithms.
    *   **Language Selector**: Select which language engine to execute the sort in.
    *   **Input Array Generator**: Generate random arrays with a specific size or type in custom numbers manually (max 50 elements, range 0–1000).
    *   **Array Visualizer**: Displays elements as vertical bars representing their height.
    *   **Metrics Cards**: Shows real-time metrics returned by the runner:
        *   **Execution Time (ms)** with microsecond precision.
        *   **Comparisons Count** showing the exact number of conditional checks.
        *   **Swaps Count** tracking physical array swaps.
        *   **Status Indicator** confirming the output array was validated as correctly sorted.

### 2. Languages Tab
*   **Purpose**: Benchmarking language runtimes.
*   **Features**:
    *   **Algorithm Selector**: Select the algorithm to benchmark.
    *   **Input Synchronization**: Provide the exact same input array to all 7 language engines in parallel.
    *   **Comparative Analysis Grid**: Automatically maps execution speed, comparisons, and swaps side-by-side.
    *   **Performance Chart**: A custom-drawn, dynamic horizontal bar chart color-coded by programming language, visualising execution speeds instantly.

### 3. Comparisons Tab
*   **Purpose**: Complex algorithmic complexity comparisons.
*   **Features**:
    *   **Language Selector**: Select which compiler/runtime toolchain to test.
    *   **All-Algorithm Parallel Run**: Runs the selected input array against all 11 sorting algorithms simultaneously.
    *   **Algorithmic Complexity Chart**: Displays bar charts comparing time, comparisons, and swaps to visualize $O(n \log n)$ vs $O(n^2)$ complexity differences.

---

## 🎨 Design System & Custom Styling

The user interface uses custom, premium Vanilla CSS styling to construct a premium dashboard experience:
*   **Color Palette**: Dark mode theme featuring curated grays (`#0d0e12`, `#161821`, `#212433`), glowing status signals, and structured language colors for charts.
*   **Glassmorphism**: Component panels use subtle backdrop filters (`backdrop-filter: blur(16px)`), thin translucent borders, and deep container drop shadows.
*   **Micro-interactions & Animations**:
    *   Transition animations for navigation tabs.
    *   Smooth scaling effects (`transform: translateY(-2px)`) on button hovers.
    *   Custom CSS keyframes for background loaders and online status pulse signals.
*   **Responsive Layout**: Built using CSS Grid layouts (`grid-template-columns: repeat(auto-fit, minmax(300px, 1fr))`) and Flexbox to ensure clean rendering across ultrawide monitors, laptops, and mobile screens.

---

## ⚙️ Environment Configuration & API Integration

The frontend connects to the backend API via Axios. The system automatically detects its hosting environment to determine the backend API base URL:

### 1. API Resolution Hierarchy
The base URL resolver dynamically evaluates the endpoint in the following order:
1.  **Environment Variable Override**: Checks `import.meta.env.VITE_API_BASE_URL`.
2.  **Production Environment Fallback**: If `import.meta.env.PROD` is true, it automatically targets the deployed Render URL: `https://ub-sort-lab-backend.onrender.com`
3.  **Local Development Fallback**: If running locally in development mode (`import.meta.env.DEV`), it defaults to: `http://localhost:3000`

### 2. Conditionally Mounted Features (History Tab)
To keep the production interface clean and database-independent, the **History** tab is hidden and routed conditionally:
*   **Dev Mode**: The "History" link is displayed in the navigation, and the route `path="/history"` is active.
*   **Production Build**: The "History" navigation element is excluded, and the route is unregistered.
*   **Router Safeguard**: If a user tries to manually access `/history` in production, a wildcard catch-all route redirects them to `/algorithms` automatically:
    ```jsx
    {import.meta.env.DEV && <Route path="/history" element={<HistoryTab />} />}
    <Route path="*" element={<Navigate to="/algorithms" replace />} />
    ```

---

## 🌐 Production Deployment
- **Provider**: Vercel (Production)
- **Framework Target**: Vite static build output (`dist/`)
- **Live URL**: https://ub-sortlab.vercel.app
- **Integration**: Communicates with the multi-language backend hosted on Render.
