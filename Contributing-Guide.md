## **Contributing to Jockey**

We're excited that you're interested in contributing to Jockey! This guide will help you get started with our development workflow and conventions.

## **Getting Started**

1. Fork the Jockey repository on GitHub.
2. Clone your fork locally:
    
    ```bash
    git clone https://github.com/your-username/tl-jockey.git
    cd tl-jockey
    ```
    
3. Set up a virtual environment:
    
    ```bash
    python3 -m venv venv
    source venv/bin/activate  # On Windows, use `venv\Scripts\activate`
    ```
    
4. Install dependencies:
    
    ```bash
    pip3 install -r requirements.txt
    ```
    

## **Development Workflow**

1. Create a new branch for your feature or bug fix:

```bash
git checkout -b feature/your-feature-name
```

2. Make your changes and commit them with a clear, descriptive message:

```bash
git commit -m "Add feature: brief description of changes"
```

3. Push your changes to your fork:

```bash
git push origin feature/your-feature-name
```

4. Open a pull request from your fork to the main Jockey repository.

## **Code Style and Conventions**

- We follow PEP 8 guidelines for Python code style.
- Use 4 spaces for indentation (no tabs).
- Maximum line length is 100 characters.
- Use meaningful variable and function names.
- Write docstrings for all functions, classes, and modules.
- Include type hints where appropriate.

## **Testing**

- Write unit tests for new features or bug fixes.
- Ensure all tests pass before submitting a pull request:

```bash
pytest tests/
```

## **Documentation**

- Update the README.md file if you've added new features or changed existing functionality.
- Keep inline comments concise and relevant.
- For significant changes, update or create appropriate documentation in a new **`docs/`** directory.

## **Pull Request Process**

1. Ensure your code adheres to the style guide and passes all tests.
2. Update the README.md with details of changes to the interface, if applicable.
3. Your pull request will be reviewed by maintainers. Be open to feedback and make necessary changes.
4. Once approved, your pull request will be merged into the main branch.

## **Community Guidelines**

- Be respectful and inclusive in your interactions with other contributors.
- If you find a bug or have a feature request, open an issue before making changes.
- For major changes, please open an issue first to discuss what you would like to change.

We appreciate your contributions to Jockey and look forward to your innovative ideas and improvements!