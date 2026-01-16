# 数据访问层片段

## MongoDB Repository 模式
```javascript
const Model = require('../models/{{ModelName}}');

class {{ModelName}}Repository {
  /**
   * 创建记录
   */
  async create(data) {
    const instance = new Model(data);
    return await instance.save();
  }

  /**
   * 根据 ID 查找
   */
  async findById(id) {
    return await Model.findById(id);
  }

  /**
   * 查找所有
   */
  async findAll(filter = {}, options = {}) {
    const { limit = 100, skip = 0, sort = { _id: -1 } } = options;
    return await Model.find(filter)
      .sort(sort)
      .limit(limit)
      .skip(skip);
  }

  /**
   * 更新记录
   */
  async updateById(id, data) {
    return await Model.findByIdAndUpdate(
      id,
      { $set: data },
      { new: true, runValidators: true }
    );
  }

  /**
   * 删除记录
   */
  async deleteById(id) {
    return await Model.findByIdAndDelete(id);
  }

  /**
   * 分页查询
   */
  async paginate(filter = {}, { page = 1, limit = 10 } = {}) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      Model.find(filter).skip(skip).limit(limit),
      Model.countDocuments(filter)
    ]);
    return {
      data,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }
}

module.exports = new {{ModelName}}Repository();
```

## SQL 查询片段
```sql
-- 分页查询模板
SELECT *
FROM {{table}}
WHERE {{conditions}}
ORDER BY {{sort_column}} {{sort_direction}}
LIMIT {{limit}} OFFSET {{offset}};

-- 统计查询模板
SELECT
  COUNT(*) as total,
  AVG({{numeric_column}}) as average,
  MIN({{date_column}}) as earliest,
  MAX({{date_column}}) as latest
FROM {{table}}
WHERE {{conditions}};

-- 分组统计模板
SELECT
  {{group_column}},
  COUNT(*) as count,
  SUM({{numeric_column}}) as sum
FROM {{table}}
WHERE {{conditions}}
GROUP BY {{group_column}}
HAVING COUNT(*) > {{threshold}};
```

## 事务处理
```javascript
/**
 * MongoDB 事务示例
 */
async function transferMoney(fromId, toId, amount) {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // 扣除发送者余额
    await User.findByIdAndUpdate(
      fromId,
      { $inc: { balance: -amount } },
      { session }
    );

    // 增加接收者余额
    await User.findByIdAndUpdate(
      toId,
      { $inc: { balance: amount } },
      { session }
    );

    // 提交事务
    await session.commitTransaction();
    return { success: true };
  } catch (error) {
    // 回滚事务
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
}
```
