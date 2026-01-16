/**
 * Code Generator Skill
 *
 * 根据规范生成代码骨架和模板。
 */

/**
 * 生成 React 组件模板
 * @param {string} componentName - 组件名称
 * @param {boolean} withHooks - 是否使用 Hooks
 * @param {boolean} withTypescript - 是否使用 TypeScript
 * @returns {string} 组件代码
 */
function generateReactComponent(componentName, withHooks = true, withTypescript = true) {
  const ts = withTypescript;
  const hooks = withHooks;

  if (hooks) {
    return ts ? `
import React, { useState, useEffect } from 'react';

interface ${componentName}Props {
  // 定义 props 类型
  title?: string;
  onAction?: () => void;
}

export const ${componentName}: React.FC<${componentName}Props> = ({
  title,
  onAction
}) => {
  const [state, setState] = useState<string>('');

  useEffect(() => {
    // 副作用逻辑
  }, []);

  const handleClick = () => {
    onAction?.();
  };

  return (
    <div className="${componentName.toLowerCase()}">
      <h2>{title || '${componentName}'}</h2>
      {/* 组件内容 */}
    </div>
  );
};

export default ${componentName};
` : `
import React, { useState, useEffect } from 'react';

export const ${componentName} = ({
  title,
  onAction
}) => {
  const [state, setState] = useState('');

  useEffect(() => {
    // 副作用逻辑
  }, []);

  const handleClick = () => {
    onAction?.();
  };

  return (
    <div className="${componentName.toLowerCase()}">
      <h2>{title || '${componentName}'}</h2>
      {/* 组件内容 */}
    </div>
  );
};

export default ${componentName};
`;
  }

  // Class component template
  return ts ? `
import React, { Component } from 'react';

interface ${componentName}Props {
  title?: string;
  onAction?: () => void;
}

interface ${componentName}State {
  state: string;
}

export class ${componentName} extends Component<${componentName}Props, ${componentName}State> {
  constructor(props: ${componentName}Props) {
    super(props);
    this.state = {
      state: ''
    };
  }

  componentDidMount() {
    // 副作用逻辑
  }

  handleClick = () => {
    this.props.onAction?.();
  };

  render() {
    return (
      <div className="${componentName.toLowerCase()}">
        <h2>{this.props.title || '${componentName}'}</h2>
        {/* 组件内容 */}
      </div>
    );
  }
}

export default ${componentName};
` : `
import React, { Component } from 'react';

export class ${componentName} extends Component {
  constructor(props) {
    super(props);
    this.state = {
      state: ''
    };
  }

  componentDidMount() {
    // 副作用逻辑
  }

  handleClick = () => {
    this.props.onAction?.();
  };

  render() {
    return (
      <div className="${componentName.toLowerCase()}">
        <h2>{this.props.title || '${componentName}'}</h2>
        {/* 组件内容 */}
      </div>
    );
  }
}

export default ${componentName};
`;
}

/**
 * 生成 API 路由模板 (Express.js)
 * @param {string} routeName - 路由名称
 * @param {string} method - HTTP 方法 (GET|POST|PUT|DELETE)
 * @param {boolean} withTypescript - 是否使用 TypeScript
 * @returns {string} 路由代码
 */
function generateAPIRoute(routeName, method = 'GET', withTypescript = true) {
  const ts = withTypescript;
  const routePath = `/${routeName.toLowerCase()}`;

  const methodHandlers = {
    GET: `// 获取资源
    const items = await Model.find();
    res.json({ success: true, data: items });`,

    POST: `// 创建资源
    const item = await Model.create(req.body);
    res.status(201).json({ success: true, data: item });`,

    PUT: `// 更新资源
    const item = await Model.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.json({ success: true, data: item });`,

    DELETE: `// 删除资源
    await Model.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Deleted' });`
  };

  return ts ? `
import { Request, Response } from 'express';
import { Model } from '../models/${routeName}';

/**
 * ${method} ${routePath}
 */
export const ${method.toLowerCase()}${routeName} = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    ${methodHandlers[method]}

    // 错误处理
    if (!items) {
      res.status(404).json({ success: false, message: 'Not found' });
      return;
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};
` : `
const Model = require('../models/${routeName}');

/**
 * ${method} ${routePath}
 */
exports.${method.toLowerCase()}${routeName} = async (req, res) => {
  try {
    ${methodHandlers[method]}

    // 错误处理
    if (!items) {
      return res.status(404).json({ success: false, message: 'Not found' });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};
`;
}

module.exports = {
  generateReactComponent,
  generateAPIRoute
};
