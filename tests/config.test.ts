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
  const categories = getCategories();
  const templates = categories.flatMap((category) => category.templates);

  for (const template of templates) {
    const dependencies = getOptionalDependenciesForTemplate(template.id);
    for (const dependency of dependencies) {
      assert.equal(typeof dependency.name, 'string');
      assert.ok(dependency.name.length > 0);
      assert.equal(typeof dependency.version, 'string');
      assert.ok(dependency.version.length > 0);
      assert.equal(typeof dependency.defaultSelected, 'boolean');
    }
  }

  const unknownTemplateDependencies = getOptionalDependenciesForTemplate('unknown-template');
  assert.deepEqual(unknownTemplateDependencies, []);
});

test('returns pinned optional dependency versions', () => {
  const categories = getCategories();
  const templates = categories.flatMap((category) => category.templates);

  for (const template of templates) {
    const dependencies = getOptionalDependenciesForTemplate(template.id);
    for (const dependency of dependencies) {
      assert.equal(getOptionalDependencyVersion(dependency.name), dependency.version);
    }
  }

  assert.equal(getOptionalDependencyVersion('unknown-dep'), undefined);
});
