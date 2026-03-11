import test from 'node:test';
import assert from 'node:assert/strict';

import {
  getCategories,
  getTemplatesByCategory,
  getOptionalDependenciesForTemplate,
  getOptionalDependencyVersion
} from '../src/config';

test('returns expected category ids in display order', () => {
  const categories = getCategories();
  assert.ok(categories.length > 0);
  assert.deepEqual(categories.map((category) => category.id), ['frontend']);
});

test('returns template list by category', () => {
  const categories = getCategories();
  for (const category of categories) {
    const templates = getTemplatesByCategory(category.id);
    assert.deepEqual(
      templates.map((template) => template.id),
      category.templates.map((template) => template.id)
    );
  }
});

test('returns optional dependencies only when template defines them', () => {
  const reactTailwindDependencies = getOptionalDependenciesForTemplate('react-tailwind');
  assert.ok(reactTailwindDependencies.length > 0);
  assert.ok(reactTailwindDependencies.some((dependency) => dependency.name === 'antd'));
  assert.ok(
    reactTailwindDependencies.some((dependency) => dependency.name === '@ant-design/icons')
  );

  const defaultSelected = reactTailwindDependencies
    .filter((dependency) => dependency.defaultSelected)
    .map((dependency) => dependency.name)
    .sort();
  assert.deepEqual(defaultSelected, ['antd', 'axios', 'zustand']);

  const reactTailwindAntdDependencies = getOptionalDependenciesForTemplate(
    'react-tailwind-antd'
  );
  assert.ok(
    !reactTailwindAntdDependencies.some((dependency) => dependency.name === 'antd')
  );
  assert.ok(
    !reactTailwindAntdDependencies.some(
      (dependency) => dependency.name === '@ant-design/icons'
    )
  );

  const unknownTemplateDependencies = getOptionalDependenciesForTemplate('unknown-template');
  assert.deepEqual(unknownTemplateDependencies, []);
});

test('returns pinned optional dependency versions', () => {
  assert.equal(getOptionalDependencyVersion('antd'), '^6.3.2');
  assert.equal(getOptionalDependencyVersion('@ant-design/icons'), '^6.1.0');
  assert.equal(getOptionalDependencyVersion('axios'), '^1.13.6');
  assert.equal(getOptionalDependencyVersion('ahooks'), '^3.9.6');
  assert.equal(getOptionalDependencyVersion('zustand'), '^5.0.11');
  assert.equal(getOptionalDependencyVersion('react-router'), '^7.13.1');
  assert.equal(getOptionalDependencyVersion('dayjs'), '^1.11.19');
  assert.equal(getOptionalDependencyVersion('es-toolkit'), '^1.45.1');
  assert.equal(getOptionalDependencyVersion('unknown-dep'), undefined);
});
