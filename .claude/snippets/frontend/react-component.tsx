# React 组件片段

## 功能组件 (Hooks + TypeScript)
```tsx
import React, { useState, useEffect } from 'react';

interface {{ComponentName}}Props {
  // 定义 props
}

export const {{ComponentName}}: React.FC<{{ComponentName}}Props> = (props) => {
  const [state, setState] = useState<string>('');

  useEffect(() => {
    // 副作用
  }, []);

  return (
    <div className="{{className}}">
      {/* JSX */}
    </div>
  );
};

export default {{ComponentName}};
```

## 自定义 Hook
```tsx
import { useState, useEffect, useCallback } from 'react';

export function use{{HookName}}() {
  const [state, setState] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const {{action}} = useCallback(async () => {
    setLoading(true);
    try {
      // 逻辑
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  return { state, loading, error, {{action}} };
}
```

## Context 模式
```tsx
import React, { createContext, useContext, useReducer } from 'react';

const {{Context}}Context = createContext(null);

const {{Context}}Provider = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, initialState);

  return (
    <{{Context}}Context.Provider value={{ state, dispatch }}>
      {children}
    </{{Context}}Context.Provider>
  );
};

export const use{{Context}} = () => useContext({{Context}}Context);
export default {{Context}}Provider;
```

## 表单处理
```tsx
import { useForm } from 'react-hook-form';

interface FormData {
  email: string;
  password: string;
}

export const {{FormName}} = () => {
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>();

  const onSubmit = (data: FormData) => {
    // 提交逻辑
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register('email', { required: true })} />
      {errors.email && <span>Email is required</span>}
      <button type="submit">Submit</button>
    </form>
  );
};
```
