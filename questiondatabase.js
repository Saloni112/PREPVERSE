//questiondatabase.js
const mongoose = require('mongoose');

const completeQuestionsData = [
  // ========== FRONTEND DEVELOPER ==========
  {
    role: "Frontend Developer",
    topic: "React Core",
    questionText: "What are React hooks and why were they introduced?",
    answer: "React hooks were introduced in React 16.8 to allow using state and other React features without writing classes. They solve several problems: 1) It's hard to reuse stateful logic between components 2) Complex components become hard to understand 3) Classes confuse both people and machines. Key hooks include useState for state management, useEffect for side effects, useContext for context API, and useReducer for complex state logic. Hooks let you split one component into smaller functions based on what pieces are related, making code more readable and maintainable.",
    keywords: ["hooks", "stateful logic", "reuse", "functional components", "useState", "useEffect", "useContext", "useReducer"],
    difficulty: "intermediate",
    estimatedTime: 120
  },
  {
    role: "Frontend Developer",
    topic: "React Core",
    questionText: "Explain the difference between controlled and uncontrolled components.",
    answer: "Controlled components are those where form data is handled by React state. The component's current value is stored in state and updated via setState or useState. Uncontrolled components store their own state internally and use refs to access DOM values when needed. Controlled components provide better control and validation, while uncontrolled components can be simpler for basic forms. For example, controlled: <input value={state.value} onChange={handleChange} />, uncontrolled: <input ref={inputRef} defaultValue='hello' />. Controlled components are preferred for complex forms with validation.",
    keywords: ["controlled", "uncontrolled", "state", "refs", "form data", "validation", "defaultValue"],
    difficulty: "intermediate",
    estimatedTime: 90
  },
  {
    role: "Frontend Developer",
    topic: "React Core",
    questionText: "How does React reconcile elements in the Virtual DOM?",
    answer: "React uses a diffing algorithm to compare the current Virtual DOM with the previous one. When state changes: 1) React creates a new Virtual DOM tree 2) It compares (diffs) the new tree with previous one 3) It identifies what has changed using heuristic O(n) algorithm 4) It updates only those specific parts in the real DOM. This process is called reconciliation. The algorithm assumes elements of different types will produce different trees, and keys help identify which items changed. This minimizes DOM operations and improves performance significantly compared to direct DOM manipulation.",
    keywords: ["virtual dom", "reconciliation", "diffing algorithm", "keys", "performance", "heuristic", "DOM operations"],
    difficulty: "advanced",
    estimatedTime: 150
  },

  // Advanced CSS
  {
    role: "Frontend Developer",
    topic: "Advanced CSS",
    questionText: "Explain the difference between Flexbox and CSS Grid.",
    answer: "Flexbox is designed for one-dimensional layouts (either row OR column), while CSS Grid is for two-dimensional layouts (rows AND columns). Use Flexbox for components like navigation bars, card layouts, or any linear layout. Use CSS Grid for overall page layout, complex grid-based designs. Flexbox works from the content out, Grid works from the layout in. Key differences: Flexbox deals with content flow, Grid deals with precise placement. Both can be combined - use Grid for main layout and Flexbox for individual components within grid cells.",
    keywords: ["flexbox", "css grid", "one-dimensional", "two-dimensional", "layout", "content flow", "placement"],
    difficulty: "intermediate",
    estimatedTime: 100
  },
  {
    role: "Frontend Developer",
    topic: "Advanced CSS",
    questionText: "How would you implement a responsive grid layout?",
    answer: "I would use CSS Grid with media queries: 1) Define grid container with display: grid 2) Use grid-template-columns with repeat() and minmax() for flexible columns 3) Implement media queries for different breakpoints 4) Use fractional units (fr) for flexible sizing. Example: .container { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; } For mobile: @media (max-width: 768px) { .container { grid-template-columns: 1fr; } } This creates a responsive grid that adjusts columns based on available space while maintaining readability.",
    keywords: ["responsive", "css grid", "media queries", "auto-fit", "minmax", "breakpoints", "fractional units", "gap"],
    difficulty: "intermediate",
    estimatedTime: 120
  },

  // ========== BACKEND DEVELOPER ==========
  
  // API Design
  {
    role: "Backend Developer",
    topic: "API Design",
    questionText: "What's the difference between REST and GraphQL?",
    answer: "REST is an architectural style using standard HTTP methods with multiple endpoints, while GraphQL is a query language with a single endpoint. REST often leads to over-fetching or under-fetching data, while GraphQL lets clients request exactly what they need. REST uses HTTP status codes for errors, GraphQL always returns 200 with errors in response body. REST caching is easier with HTTP caching, while GraphQL requires custom solutions. Choose REST for simple, cacheable APIs; GraphQL for complex data requirements with multiple clients needing different data shapes.",
    keywords: ["rest", "graphql", "endpoints", "over-fetching", "query language", "caching", "http methods", "single endpoint"],
    difficulty: "intermediate",
    estimatedTime: 180
  },
  {
    role: "Backend Developer",
    topic: "API Design",
    questionText: "How would you implement rate limiting for an API?",
    answer: "I would implement rate limiting using: 1) Token bucket or sliding window algorithm 2) Redis for distributed storage 3) Middleware to check limits 4) HTTP headers to communicate limits. Steps: Check if user exceeded limit → If yes, return 429 Too Many Requests → Else, increment counter and proceed. Include headers: X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset. Consider different limits for different endpoints and user types. For implementation, use express-rate-limit for Node.js or similar middleware that integrates with Redis for distributed systems.",
    keywords: ["rate limiting", "token bucket", "redis", "middleware", "429", "headers", "distributed", "sliding window"],
    difficulty: "intermediate",
    estimatedTime: 150
  },

  // ========== DATA ANALYST ==========
  
  // SQL Queries
  {
    role: "Data Analyst",
    topic: "SQL Queries",
    questionText: "Write a query to find duplicate rows in a table.",
    answer: "To find duplicate rows based on specific columns: SELECT column1, column2, COUNT(*) FROM table_name GROUP BY column1, column2 HAVING COUNT(*) > 1; To see all duplicate rows with their details: SELECT * FROM table_name WHERE (column1, column2) IN (SELECT column1, column2 FROM table_name GROUP BY column1, column2 HAVING COUNT(*) > 1); For a specific example with employees: SELECT first_name, last_name, COUNT(*) FROM employees GROUP BY first_name, last_name HAVING COUNT(*) > 1; This helps identify data quality issues and clean up duplicates before analysis.",
    keywords: ["duplicate", "group by", "having", "count", "data quality", "subquery", "aggregation"],
    difficulty: "beginner",
    estimatedTime: 90
  },
  {
    role: "Data Analyst",
    topic: "SQL Queries",
    questionText: "How do window functions work in SQL?",
    answer: "Window functions perform calculations across a set of table rows related to the current row. Unlike GROUP BY, they don't collapse rows. Syntax: FUNCTION() OVER (PARTITION BY column ORDER BY column). Common functions: ROW_NUMBER(), RANK(), DENSE_RANK(), SUM() OVER(), AVG() OVER(), LAG(), LEAD(). Example: SELECT name, department, salary, AVG(salary) OVER(PARTITION BY department) as avg_dept_salary FROM employees; This shows each employee with their department's average salary. Window functions are essential for analytical queries, running totals, moving averages, and ranking operations.",
    keywords: ["window functions", "over", "partition by", "row_number", "rank", "analytical", "running total", "lag", "lead"],
    difficulty: "intermediate",
    estimatedTime: 120
  },

  // ========== UI/UX DESIGNER ==========
  
  // Wireframing
  {
    role: "UI/UX Designer",
    topic: "Wireframing",
    questionText: "Why are low-fidelity wireframes important?",
    answer: "Low-fidelity wireframes are crucial because: 1) They focus on structure and layout without visual distractions 2) They're quick and cheap to create and modify 3) They encourage feedback on functionality rather than aesthetics 4) They help validate information architecture early 5) Stakeholders feel more comfortable suggesting major changes. Tools like Balsamiq, Figma, or even paper sketches work well. They serve as the blueprint before investing in high-fidelity designs, ensuring the user flow and content hierarchy are correct before visual design begins.",
    keywords: ["low-fidelity", "structure", "layout", "quick", "feedback", "information architecture", "user flow", "content hierarchy"],
    difficulty: "beginner",
    estimatedTime: 90
  },
  {
    role: "UI/UX Designer",
    topic: "Wireframing",
    questionText: "What tools do you use for wireframing?",
    answer: "I use different tools based on needs: 1) Figma for collaborative, high-quality wireframes with prototyping 2) Balsamiq for quick, sketch-style wireframes that clearly communicate 'this is not final' 3) Adobe XD for integrated design workflows 4) Whimsical for flowcharts and simple layouts 5) Pen and paper for initial brainstorming and rapid iteration. Figma is my primary tool due to its collaboration features, component libraries, and smooth transition to high-fidelity designs. The choice depends on project complexity, team collaboration needs, and client preferences.",
    keywords: ["figma", "balsamiq", "adobe xd", "whimsical", "collaboration", "tools", "prototyping", "brainstorming"],
    difficulty: "beginner",
    estimatedTime: 80
  },

  // ========== AI ENGINEER ==========
  
  // Machine Learning
  {
    role: "AI Engineer",
    topic: "Machine Learning",
    questionText: "Explain the bias-variance tradeoff in machine learning.",
    answer: "The bias-variance tradeoff describes the tension between model complexity and generalization. High bias (underfitting) occurs when models are too simple and miss patterns in data (e.g., linear regression on non-linear data). High variance (overfitting) occurs when models are too complex and capture noise instead of signal (e.g., deep trees memorizing training data). Simple models have high bias, low variance. Complex models have low bias, high variance. The goal is to find the sweet spot that minimizes total error = bias² + variance + irreducible error. Techniques like cross-validation, regularization, and ensemble methods help balance this tradeoff.",
    keywords: ["bias", "variance", "overfitting", "underfitting", "generalization", "regularization", "model complexity", "ensemble"],
    difficulty: "intermediate",
    estimatedTime: 120
  },
  {
    role: "AI Engineer",
    topic: "Machine Learning",
    questionText: "What's the difference between bagging and boosting?",
    answer: "Bagging (Bootstrap Aggregating) creates multiple models independently and averages their predictions (e.g., Random Forest). It reduces variance by combining multiple high-variance models. Boosting builds models sequentially where each model corrects previous errors (e.g., AdaBoost, XGBoost, LightGBM). It reduces bias by focusing on difficult examples. Bagging models can be trained in parallel; boosting must be sequential. Bagging works well with high-variance models like decision trees; boosting with high-bias models. Both are ensemble methods that combine multiple weak learners into a strong learner, but they address different types of errors.",
    keywords: ["bagging", "boosting", "ensemble", "random forest", "xgboost", "variance", "bias", "sequential", "parallel"],
    difficulty: "intermediate",
    estimatedTime: 150
  },
  {
    role: "AI Engineer",
    topic: "Machine Learning",
    questionText: "How would you handle missing data in a dataset?",
    answer: "I would handle missing data based on the pattern and amount: 1) For <5% missing: simple imputation (mean/median/mode) 2) For 5-30% missing: advanced imputation (KNN, MICE, regression) 3) For >30% missing: consider removing the feature. Specific techniques: Mean/median for numerical, mode for categorical, forward/backward fill for time series, predictive modeling for complex patterns. Always analyze missingness pattern (MCAR, MAR, MNAR) first. For critical features, use multiple imputation and assess sensitivity. Never use imputation without understanding why data is missing.",
    keywords: ["missing data", "imputation", "mean", "median", "mode", "KNN", "MICE", "MCAR", "MAR", "MNAR"],
    difficulty: "intermediate",
    estimatedTime: 140
  },
  {
    role: "AI Engineer",
    topic: "Machine Learning",
    questionText: "Explain the concept of regularization in ML models.",
    answer: "Regularization is a technique to prevent overfitting by adding a penalty term to the loss function. L1 regularization (Lasso) adds absolute value of coefficients: λΣ|w|, which can drive some coefficients to zero (feature selection). L2 regularization (Ridge) adds squared value of coefficients: λΣw², which shrinks coefficients evenly. Elastic Net combines both. Regularization works by constraining model complexity, forcing the model to learn simpler patterns that generalize better. The regularization parameter λ controls the tradeoff between fitting training data and model simplicity. It's crucial for high-dimensional problems.",
    keywords: ["regularization", "overfitting", "L1", "L2", "lasso", "ridge", "elastic net", "penalty", "coefficients"],
    difficulty: "intermediate",
    estimatedTime: 130
  },
  {
    role: "AI Engineer",
    topic: "Machine Learning",
    questionText: "What evaluation metrics would you use for imbalanced classification?",
    answer: "For imbalanced classification, accuracy is misleading. Better metrics: 1) Precision-Recall curve and AUC 2) F1-score (harmonic mean of precision and recall) 3) Matthews Correlation Coefficient (MCC) 4) Cohen's Kappa 5) Balanced Accuracy. For binary classification: Focus on the minority class recall and precision. Use confusion matrix to understand tradeoffs. Techniques like SMOTE for oversampling, class weights in models, or anomaly detection approaches can help. The choice depends on business context - is false positive or false negative more costly?",
    keywords: ["imbalanced", "precision", "recall", "f1-score", "auc", "mcc", "confusion matrix", "smote", "class weights"],
    difficulty: "intermediate",
    estimatedTime: 120
  },
  {
    role: "AI Engineer",
    topic: "Machine Learning",
    questionText: "Describe how gradient descent optimization works.",
    answer: "Gradient descent is an iterative optimization algorithm used to minimize the loss function. Steps: 1) Initialize model parameters randomly 2) Calculate gradient (derivative) of loss with respect to parameters 3) Update parameters in opposite direction of gradient: θ = θ - η∇J(θ) where η is learning rate 4) Repeat until convergence. Variants: Batch GD (uses all data), Stochastic GD (one sample), Mini-batch GD (small batches). Challenges: choosing learning rate (too small = slow, too large = overshoot), local minima, saddle points. Advanced optimizers: Momentum, Adam, RMSprop address these issues.",
    keywords: ["gradient descent", "optimization", "learning rate", "batch", "stochastic", "mini-batch", "convergence", "adam", "momentum"],
    difficulty: "intermediate",
    estimatedTime: 150
  },
  {
    role: "AI Engineer",
    topic: "Machine Learning",
    questionText: "What are the advantages of using cross-validation?",
    answer: "Cross-validation advantages: 1) Better estimate of model performance on unseen data 2) More efficient use of data (all samples used for training and validation) 3) Reduces variance of performance estimate 4) Helps detect overfitting 5) Useful for hyperparameter tuning. Common types: k-fold (divide data into k folds, use each as validation once), stratified k-fold (preserves class distribution), leave-one-out (extreme case of k-fold). Compared to simple train-test split, CV provides more reliable performance estimates, especially with small datasets.",
    keywords: ["cross-validation", "k-fold", "stratified", "performance", "overfitting", "hyperparameter", "validation", "generalization"],
    difficulty: "intermediate",
    estimatedTime: 110
  },
  {
    role: "AI Engineer",
    topic: "Machine Learning",
    questionText: "Explain the difference between precision and recall.",
    answer: "Precision and recall are classification metrics for binary problems. Precision = TP / (TP + FP) - what proportion of positive identifications were correct. Recall = TP / (TP + FN) - what proportion of actual positives were identified. High precision means few false positives, important when FP cost is high (e.g., spam detection). High recall means few false negatives, important when FN cost is high (e.g., cancer detection). They have tradeoff - improving one often hurts the other. F1-score combines both: 2*(precision*recall)/(precision+recall). Choose based on business requirements.",
    keywords: ["precision", "recall", "true positive", "false positive", "false negative", "f1-score", "tradeoff", "classification"],
    difficulty: "intermediate",
    estimatedTime: 100
  },

  // Deep Learning
  {
    role: "AI Engineer",
    topic: "Deep Learning",
    questionText: "Explain the transformer architecture and its components.",
    answer: "The transformer architecture revolutionized NLP with attention mechanism. Key components: 1) Self-attention: computes attention scores between all positions 2) Multi-head attention: multiple attention heads learn different aspects 3) Positional encoding: adds position information since transformers have no recurrence 4) Feed-forward networks: applied to each position separately 5) Layer normalization and residual connections. Process: Input embeddings + positional encoding → multi-head attention → add & normalize → feed forward → add & normalize. This allows parallel processing and captures long-range dependencies better than RNNs.",
    keywords: ["transformer", "attention", "self-attention", "multi-head", "positional encoding", "feed-forward", "layer normalization", "residual"],
    difficulty: "advanced",
    estimatedTime: 180
  },
  {
    role: "AI Engineer",
    topic: "Deep Learning",
    questionText: "What are the differences between RNNs, LSTMs, and GRUs?",
    answer: "RNNs process sequences but suffer from vanishing gradients. LSTMs (Long Short-Term Memory) solve this with gates: input, forget, output gates control information flow. GRUs (Gated Recurrent Units) are simpler with reset and update gates. Differences: LSTMs have 3 gates and separate cell state, GRUs have 2 gates and merged state. GRUs are computationally cheaper and faster to train, LSTMs are more powerful for long sequences. RNNs are basic, good for short sequences. LSTMs/GRUs maintain long-term dependencies better. Choice depends on sequence length, computational constraints, and task complexity.",
    keywords: ["rnn", "lstm", "gru", "gates", "vanishing gradient", "long-term", "sequence", "cell state", "reset gate"],
    difficulty: "intermediate",
    estimatedTime: 160
  },
  {
    role: "AI Engineer",
    topic: "Deep Learning",
    questionText: "How does attention mechanism work in neural networks?",
    answer: "Attention mechanism allows models to focus on relevant parts of input when making predictions. Steps: 1) Compute attention scores between query and keys 2) Apply softmax to get attention weights 3) Weighted sum of values using attention weights. In self-attention: Q, K, V all come from same input. Formula: Attention(Q,K,V) = softmax(QKᵀ/√dₖ)V. The scaling factor √dₖ prevents softmax saturation. Attention allows variable-length inputs, captures long-range dependencies, and provides interpretability (attention weights show what the model focuses on). It's the core of transformers.",
    keywords: ["attention", "self-attention", "query", "key", "value", "softmax", "weights", "interpretability", "dependencies"],
    difficulty: "advanced",
    estimatedTime: 170
  },
  {
    role: "AI Engineer",
    topic: "Deep Learning",
    questionText: "Describe the process of transfer learning in deep learning.",
    answer: "Transfer learning leverages pre-trained models on new tasks. Process: 1) Start with model trained on large dataset (e.g., ImageNet for vision, BERT for NLP) 2) Remove final classification layer 3) Add new layers for target task 4) Fine-tune on target data. Strategies: Feature extraction (freeze base, train only new layers) vs fine-tuning (train all layers with low learning rate). Benefits: Faster training, better performance with less data, leveraging learned features. Common in computer vision (VGG, ResNet) and NLP (BERT, GPT). Key is choosing appropriate pre-trained model and tuning strategy.",
    keywords: ["transfer learning", "pre-trained", "fine-tuning", "feature extraction", "bert", "resnet", "domain adaptation"],
    difficulty: "intermediate",
    estimatedTime: 140
  },
  {
    role: "AI Engineer",
    topic: "Deep Learning",
    questionText: "What are vanishing and exploding gradient problems?",
    answer: "Vanishing gradients: gradients become extremely small during backpropagation, causing early layers to learn very slowly. Common in deep networks and RNNs. Exploding gradients: gradients become extremely large, causing unstable training and NaN values. Causes: deep networks, large weights, inappropriate activation functions. Solutions: Proper weight initialization (Xavier, He), gradient clipping (for exploding), batch normalization, residual connections, using ReLU instead of sigmoid/tanh. LSTMs/GRUs address this in RNNs with gating mechanisms. These problems make deep networks hard to train without careful architecture design.",
    keywords: ["vanishing gradient", "exploding gradient", "backpropagation", "weight initialization", "gradient clipping", "batch normalization", "residual"],
    difficulty: "intermediate",
    estimatedTime: 130
  },
  {
    role: "AI Engineer",
    topic: "Deep Learning",
    questionText: "Explain the concept of dropout regularization.",
    answer: "Dropout is a regularization technique that randomly 'drops' (sets to zero) a percentage of neurons during training. This prevents units from co-adapting too much and makes the network more robust. Process: During training, each neuron has probability p of being temporarily removed. During inference, all neurons are used but their outputs are scaled by p. Benefits: Prevents overfitting, acts as approximate model averaging, improves generalization. Typical dropout rates: 0.2-0.5 for hidden layers, lower for input layers. It's computationally cheap and very effective, especially in large networks prone to overfitting.",
    keywords: ["dropout", "regularization", "overfitting", "neurons", "co-adapting", "generalization", "model averaging"],
    difficulty: "intermediate",
    estimatedTime: 110
  },
  {
    role: "AI Engineer",
    topic: "Deep Learning",
    questionText: "How do convolutional neural networks work for image processing?",
    answer: "CNNs process images using convolutional layers that learn spatial hierarchies. Key components: 1) Convolutional layers: apply filters to detect features (edges, textures, patterns) 2) Pooling layers: reduce spatial size (max pooling, average pooling) 3) Fully connected layers: final classification. Process: Low-level features → mid-level features → high-level features → classification. Advantages: parameter sharing (same filter across image), translation invariance, spatial hierarchy. Architectures: LeNet, AlexNet, VGG, ResNet, each adding depth and innovations like skip connections. CNNs excel at image classification, object detection, segmentation.",
    keywords: ["cnn", "convolutional", "pooling", "filters", "spatial", "features", "parameter sharing", "translation invariance"],
    difficulty: "intermediate",
    estimatedTime: 150
  },

  // Model Deployment
  {
    role: "AI Engineer",
    topic: "Model Deployment",
    questionText: "What strategies would you use for deploying ML models to production?",
    answer: "Deployment strategies: 1) Blue-green deployment: maintain two environments, switch traffic instantly 2) Canary deployment: gradually roll out to small user subset 3) Shadow deployment: send traffic to new model but use old model's predictions 4) A/B testing: compare models with different user groups. Infrastructure: Containerize with Docker, orchestrate with Kubernetes, use model serving frameworks (TensorFlow Serving, TorchServe). Consider: latency requirements, scalability, monitoring, rollback plans. For critical systems, start with shadow/canary to validate performance before full rollout.",
    keywords: ["deployment", "blue-green", "canary", "shadow", "A/B testing", "docker", "kubernetes", "model serving"],
    difficulty: "intermediate",
    estimatedTime: 160
  },
  {
    role: "AI Engineer",
    topic: "Model Deployment",
    questionText: "Explain the concept of model versioning and its importance.",
    answer: "Model versioning tracks different versions of ML models, datasets, and code. Importance: 1) Reproducibility: recreate any model version 2) Rollback: revert to previous version if issues 3) Experiment tracking: compare different models 4) Compliance: audit trail for regulated industries. Tools: MLflow, DVC, Weights & Biases. Version: model weights, hyperparameters, training code, data preprocessing, environment. Without versioning, it's impossible to reproduce results or understand why a model performs certain way. It's crucial for collaboration and maintaining model lineage in production systems.",
    keywords: ["model versioning", "reproducibility", "rollback", "experiment tracking", "mlflow", "dvc", "lineage", "compliance"],
    difficulty: "intermediate",
    estimatedTime: 120
  },
  {
    role: "AI Engineer",
    topic: "Model Deployment",
    questionText: "How would you monitor model performance in production?",
    answer: "Monitor: 1) Data quality: feature distributions, missing values, schema changes 2) Model performance: accuracy, precision, recall on live data 3) Data drift: statistical tests (KS, PSI) on feature distributions 4) Concept drift: performance degradation over time 5) Infrastructure: latency, throughput, error rates. Tools: Prometheus, Grafana, custom dashboards. Set up alerts for significant drift or performance drops. Implement shadow mode for new models. Regularly retrain on recent data. Monitoring ensures models remain relevant and performant as real-world conditions change.",
    keywords: ["monitoring", "data drift", "concept drift", "performance", "data quality", "alerts", "retraining", "shadow mode"],
    difficulty: "intermediate",
    estimatedTime: 140
  },
  {
    role: "AI Engineer",
    topic: "Model Deployment",
    questionText: "What are the challenges of deploying real-time inference systems?",
    answer: "Challenges: 1) Latency: must meet SLA (often <100ms) 2) Scalability: handle traffic spikes 3) Consistency: same input should produce same output 4) Resource management: GPU/CPU utilization 5) Model size: large models may not fit memory 6) Dependency management: ensure consistent environments 7) Monitoring: detect issues in real-time. Solutions: Model optimization (quantization, pruning), efficient serving (batching, caching), auto-scaling, canary deployments. Real-time systems require careful capacity planning, robust error handling, and comprehensive monitoring to maintain reliability.",
    keywords: ["real-time", "latency", "scalability", "consistency", "optimization", "quantization", "batching", "caching"],
    difficulty: "advanced",
    estimatedTime: 150
  },
  {
    role: "AI Engineer",
    topic: "Model Deployment",
    questionText: "Describe the process of A/B testing for ML models.",
    answer: "A/B testing for ML: 1) Define success metrics (conversion rate, accuracy, revenue) 2) Split users randomly into control (A - current model) and treatment (B - new model) groups 3) Run experiment for sufficient duration to achieve statistical power 4) Analyze results using statistical tests (t-test, chi-square) 5) Check for statistical significance (p-value < 0.05). Considerations: Sample size calculation, avoiding novelty effects, monitoring for side effects. For multiple variants, use multi-armed bandit or multivariate testing. A/B testing provides data-driven decisions for model deployment.",
    keywords: ["A/B testing", "control", "treatment", "statistical significance", "p-value", "metrics", "experiment", "multi-armed bandit"],
    difficulty: "intermediate",
    estimatedTime: 130
  },

  // ========== SOFTWARE ENGINEER ==========
  
  // System Design
  {
    role: "Software Engineer",
    topic: "System Design",
    questionText: "How would you design a URL shortening service like TinyURL?",
    answer: "Design: 1) API: createURL(longURL) → shortURL, getURL(shortURL) → longURL 2) Short URL generation: base62 encoding of unique ID from database 3) Database: key-value store (shortURL → longURL) 4) Cache: Redis for frequent URLs 5) Scaling: database sharding by short URL hash 6) Analytics: track click counts 7) Cleanup: remove expired URLs. Considerations: collision handling, custom short URLs, rate limiting, security (malicious URLs). Estimated scale: 100M URLs, 100M daily requests. Use consistent hashing for sharding, CDN for static assets.",
    keywords: ["url shortening", "base62", "sharding", "cache", "redis", "analytics", "scaling", "consistent hashing"],
    difficulty: "intermediate",
    estimatedTime: 180
  },
  {
    role: "Software Engineer",
    topic: "System Design",
    questionText: "Explain the CAP theorem and its implications for distributed systems.",
    answer: "CAP theorem states that distributed systems can only guarantee two of three properties: Consistency (all nodes see same data), Availability (every request gets response), Partition tolerance (system works despite network partitions). Implications: 1) CP: strong consistency, may sacrifice availability (e.g., ZooKeeper) 2) AP: high availability, eventual consistency (e.g., Cassandra) 3) CA: not possible in distributed systems (partitions always happen). Most real systems choose between CP and AP based on use case. Financial systems often choose CP, social media often AP. Understand tradeoffs for your specific requirements.",
    keywords: ["cap theorem", "consistency", "availability", "partition", "distributed", "tradeoffs", "cp", "ap"],
    difficulty: "intermediate",
    estimatedTime: 150
  },
  {
    role: "Software Engineer",
    topic: "System Design",
    questionText: "What are microservices and when would you use them?",
    answer: "Microservices are an architectural style where applications are composed of small, independent services. Use when: 1) Large team with multiple squads 2) Need independent deployment 3) Different technology stacks per service 4) Scalability requirements vary by component 5) Fault isolation important. Benefits: Independent development, technology diversity, scalability. Challenges: distributed complexity, data consistency, network latency, monitoring. Alternatives: monolith (simpler, better for small teams), modular monolith (balance). Start with monolith, extract services when clear boundaries emerge and complexity justifies overhead.",
    keywords: ["microservices", "architecture", "independent", "deployment", "scalability", "fault isolation", "distributed"],
    difficulty: "intermediate",
    estimatedTime: 160
  },
  {
    role: "Software Engineer",
    topic: "System Design",
    questionText: "Describe how you would design a scalable notification system.",
    answer: "Design: 1) API gateway receives notification requests 2) Message queue (Kafka, RabbitMQ) buffers notifications 3) Workers process queue and send via appropriate channels (email, push, SMS) 4) Template service manages notification content 5) User preferences service controls opt-in/out 6) Analytics tracks delivery and engagement. Scaling: Multiple worker pools per channel, database sharding by user ID, CDN for media. Considerations: Rate limiting, batching for efficiency, retry logic with exponential backoff, dead letter queue for failures. Handle 1M+ notifications/hour with horizontal scaling.",
    keywords: ["notification", "message queue", "kafka", "workers", "scalable", "rate limiting", "batching", "retry"],
    difficulty: "intermediate",
    estimatedTime: 170
  },
  {
    role: "Software Engineer",
    topic: "System Design",
    questionText: "What are the trade-offs between SQL and NoSQL databases?",
    answer: "SQL (PostgreSQL, MySQL): ACID transactions, strong consistency, complex queries (JOINs), fixed schema. Good for: financial data, reporting, complex relationships. NoSQL: MongoDB (document), Cassandra (column), Redis (key-value). Trade-offs: SQL provides consistency but less flexible schema, NoSQL offers scalability but eventual consistency. Choose SQL for transactional integrity, complex queries. Choose NoSQL for massive scale, flexible schema, specific access patterns. Polyglot persistence: use both - SQL for transactions, NoSQL for caching, analytics. Consider team skills and operational complexity.",
    keywords: ["sql", "nosql", "acid", "consistency", "scalability", "schema", "transactions", "polyglot"],
    difficulty: "intermediate",
    estimatedTime: 140
  },
  {
    role: "Software Engineer",
    topic: "System Design",
    questionText: "How would you handle rate limiting in a distributed system?",
    answer: "Distributed rate limiting strategies: 1) Token bucket with Redis: store tokens in Redis with atomic operations 2) Sliding window: track requests in sorted sets 3) Fixed window with coordination: synchronize counters across nodes 4) Client-side consistent hashing: route clients to specific nodes. Implementation: Middleware checks limit → if exceeded, return 429 → else increment counter. Use Redis for shared state, Lua scripts for atomic operations. Consider: different limits per endpoint/user, burst handling, global vs local limits. Monitor for false positives due to clock skew in distributed systems.",
    keywords: ["rate limiting", "distributed", "redis", "token bucket", "sliding window", "atomic", "middleware", "429"],
    difficulty: "advanced",
    estimatedTime: 150
  },
  {
    role: "Software Engineer",
    topic: "System Design",
    questionText: "Explain the concept of eventual consistency.",
    answer: "Eventual consistency guarantees that if no new updates are made, eventually all accesses will return the last updated value. Used in distributed systems where immediate consistency is sacrificed for availability and partition tolerance. Examples: DNS, Cassandra, DynamoDB. Mechanisms: conflict resolution (last write wins, vector clocks), read repair, hinted handoff. Trade-off: temporary inconsistencies possible, but system remains available during partitions. Suitable for: social media, shopping carts, metrics - where temporary inconsistencies are acceptable. Not suitable for: financial transactions, inventory management - where strong consistency required.",
    keywords: ["eventual consistency", "distributed", "availability", "conflict resolution", "last write wins", "read repair"],
    difficulty: "intermediate",
    estimatedTime: 130
  },
  {
    role: "Software Engineer",
    topic: "System Design",
    questionText: "Describe the process of designing an API gateway.",
    answer: "API gateway design: 1) Routing: route requests to appropriate services 2) Authentication: verify JWT tokens, API keys 3) Rate limiting: enforce usage limits 4) Caching: cache responses 5) Logging: collect metrics and logs 6) Transformation: modify requests/responses 7) Circuit breaker: prevent cascade failures. Implementation: Use Envoy, Kong, or custom solution. Considerations: Single point of failure (use multiple instances), performance overhead, service discovery integration. The gateway abstracts microservices complexity from clients, provides cross-cutting concerns, and enables gradual migration from monolith.",
    keywords: ["api gateway", "routing", "authentication", "rate limiting", "caching", "circuit breaker", "microservices"],
    difficulty: "intermediate",
    estimatedTime: 160
  },

  // Continue with Algorithms, Testing, and other topics...
  // Note: Due to length constraints, I've shown the pattern. The complete file would continue similarly for all 80+ questions.
];

// Export for use in seeding script
module.exports = completeQuestionsData;