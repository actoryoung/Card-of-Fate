# API 路由片段

## Express.js 路由
```javascript
const express = require('express');
const router = express.Router();

/**
 * GET /{{resource}}
 * 获取资源列表
 */
router.get('/', async (req, res, next) => {
  try {
    const items = await Model.find();
    res.json({
      success: true,
      data: items
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /{{resource}}/:id
 * 获取单个资源
 */
router.get('/:id', async (req, res, next) => {
  try {
    const item = await Model.findById(req.params.id);
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Resource not found'
      });
    }
    res.json({
      success: true,
      data: item
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /{{resource}}
 * 创建资源
 */
router.post('/', async (req, res, next) => {
  try {
    const item = await Model.create(req.body);
    res.status(201).json({
      success: true,
      data: item
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /{{resource}}/:id
 * 更新资源
 */
router.put('/:id', async (req, res, next) => {
  try {
    const item = await Model.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Resource not found'
      });
    }
    res.json({
      success: true,
      data: item
    });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /{{resource}}/:id
 * 删除资源
 */
router.delete('/:id', async (req, res, next) => {
  try {
    const item = await Model.findByIdAndDelete(req.params.id);
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Resource not found'
      });
    }
    res.json({
      success: true,
      message: 'Resource deleted'
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
```

## 错误处理中间件
```javascript
/**
 * 全局错误处理中间件
 */
function errorHandler(err, req, res, next) {
  // 记录错误
  console.error('Error:', err);

  // 判断错误类型
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Validation Error',
      errors: Object.values(err.errors).map(e => e.message)
    });
  }

  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      message: 'Invalid ID format'
    });
  }

  if (err.code === 11000) {
    return res.status(409).json({
      success: false,
      message: 'Duplicate key error'
    });
  }

  // 默认错误响应
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
}

module.exports = errorHandler;
```

## 认证中间件
```javascript
const jwt = require('jsonwebtoken');

/**
 * 验证 JWT Token
 */
function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'No token provided'
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }
}

/**
 * 检查角色权限
 */
function authorize(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions'
      });
    }
    next();
  };
}

module.exports = { authenticate, authorize };
```
