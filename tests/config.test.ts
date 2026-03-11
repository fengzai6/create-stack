import test from 'node:test';
import assert from 'node:assert/strict';

import {
  CATEGORY_IDS,
  getCategories,
  getTemplatesByCategory,
  getOptionalDependenciesForTemplate,
  getOptionalDependencyVersion
} from '../src/config';

test('returns expected category ids in display order', () => {
  assert.deepEqual(CATEGORY_IDS, ['frontend', 'backend', 'fullstack']);
  assert.deepEqual(
    getCategories().map((category) => category.id),
    ['frontend', 'backend', 'fullstack']
  );
});

test('returns template list by category', () => {
  const frontendTemplates = getTemplatesByCategory('frontend');
  assert.equal(frontendTemplates.length, 1);
  assert.equal(frontendTemplates[0]?.id, 'react');

  const backendTemplates = getTemplatesByCategory('backend');
  assert.equal(backendTemplates.length, 1);
  assert.equal(backendTemplates[0]?.id, 'express');
});

test('returns optional dependencies only when template defines them', () => {
  const reactDependencies = getOptionalDependenciesForTemplate('react');
  assert.ok(reactDependencies.length > 0);
  assert.ok(reactDependencies.some((dependency) => dependency.name === 'antd'));
  assert.ok(
    reactDependencies.some((dependency) => dependency.name === '@ant-design/icons')
  );

  const defaultSelected = reactDependencies
    .filter((dependency) => dependency.defaultSelected)
    .map((dependency) => dependency.name)
    .sort();
  assert.deepEqual(defaultSelected, ['antd', 'axios', 'zustand']);

  const expressDependencies = getOptionalDependenciesForTemplate('express');
  assert.deepEqual(expressDependencies, []);
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
