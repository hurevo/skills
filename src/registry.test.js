import { describe, it } from 'node:test'
import assert from 'node:assert'
import { SKILLS, SKILL_NAMES, SERVICE_SKILL_SETS, SERVICE_NAMES } from './registry.js'

describe('registry', () => {
  describe('SKILLS object', () => {
    it('contains all 25 skills', () => {
      assert.strictEqual(Object.keys(SKILLS).length, 25)
    })

    it('has all skill names in SKILL_NAMES', () => {
      const skillsFromKeys = Object.keys(SKILLS).sort()
      const skillNamesArray = SKILL_NAMES.sort()
      assert.deepEqual(skillNamesArray, skillsFromKeys)
    })

    it('includes all core skills', () => {
      assert(SKILLS['hurevo-project-rules'])
    })

    it('includes all service skills', () => {
      const serviceSkills = [
        'hurevo-laravel',
        'hurevo-automation',
        'hurevo-ai-solution',
        'hurevo-modernization',
        'hurevo-react',
        'hurevo-nextjs',
        'hurevo-python-fastapi',
        'hurevo-docker',
        'hurevo-database-migration',
      ]
      for (const skill of serviceSkills) {
        assert(SKILLS[skill], `Missing skill: ${skill}`)
      }
    })

    it('includes all quality skills', () => {
      const qualitySkills = [
        'hurevo-security',
        'hurevo-testing',
        'hurevo-api-docs',
        'hurevo-code-review',
        'hurevo-performance',
        'hurevo-accessibility',
        'hurevo-ci-cd',
      ]
      for (const skill of qualitySkills) {
        assert(SKILLS[skill], `Missing skill: ${skill}`)
      }
    })

    it('includes all compliance skills', () => {
      const complianceSkills = [
        'hurevo-compliance-uu-pdp',
        'hurevo-compliance-ojk',
        'hurevo-compliance-hipaa',
        'hurevo-compliance-pci-dss',
      ]
      for (const skill of complianceSkills) {
        assert(SKILLS[skill], `Missing skill: ${skill}`)
      }
    })

    it('includes all workflow skills', () => {
      const workflowSkills = [
        'hurevo-sprint-planning',
        'hurevo-deployment-runbook',
        'hurevo-incident-response',
      ]
      for (const skill of workflowSkills) {
        assert(SKILLS[skill], `Missing skill: ${skill}`)
      }
    })

    it('includes branding skill', () => {
      assert(SKILLS['hurevo-branding'])
    })

    it('each skill has description and category', () => {
      for (const [name, skill] of Object.entries(SKILLS)) {
        assert(skill.description, `${name} missing description`)
        assert(skill.category, `${name} missing category`)
      }
    })

    it('all categories are valid', () => {
      const validCategories = ['core', 'service', 'quality', 'compliance', 'workflow', 'branding']
      for (const skill of Object.values(SKILLS)) {
        assert(validCategories.includes(skill.category), `Invalid category: ${skill.category}`)
      }
    })

    it('core skill has correct category', () => {
      assert.strictEqual(SKILLS['hurevo-project-rules'].category, 'core')
    })

    it('service skill has correct category', () => {
      assert.strictEqual(SKILLS['hurevo-laravel'].category, 'service')
    })

    it('quality skill has correct category', () => {
      assert.strictEqual(SKILLS['hurevo-security'].category, 'quality')
    })

    it('compliance skill has correct category', () => {
      assert.strictEqual(SKILLS['hurevo-compliance-uu-pdp'].category, 'compliance')
    })

    it('workflow skill has correct category', () => {
      assert.strictEqual(SKILLS['hurevo-sprint-planning'].category, 'workflow')
    })

    it('branding skill has correct category', () => {
      assert.strictEqual(SKILLS['hurevo-branding'].category, 'branding')
    })

    it('service skills may have optional service field', () => {
      assert.strictEqual(SKILLS['hurevo-laravel'].service, 'laravel')
      assert.strictEqual(SKILLS['hurevo-automation'].service, 'automation')
      assert.strictEqual(SKILLS['hurevo-ai-solution'].service, 'ai')
      assert.strictEqual(SKILLS['hurevo-modernization'].service, 'modernization')
    })

    it('non-service skills do not have service field', () => {
      assert.strictEqual(SKILLS['hurevo-security'].service, undefined)
      assert.strictEqual(SKILLS['hurevo-branding'].service, undefined)
    })
  })

  describe('SKILL_NAMES', () => {
    it('is an array', () => {
      assert(Array.isArray(SKILL_NAMES))
    })

    it('has 25 items', () => {
      assert.strictEqual(SKILL_NAMES.length, 25)
    })

    it('contains only strings', () => {
      for (const name of SKILL_NAMES) {
        assert.strictEqual(typeof name, 'string')
      }
    })

    it('all names match SKILLS keys', () => {
      const skillKeys = Object.keys(SKILLS).sort()
      const sortedNames = SKILL_NAMES.sort()
      assert.deepEqual(sortedNames, skillKeys)
    })
  })

  describe('SERVICE_SKILL_SETS', () => {
    it('has laravel, automation, ai, modernization services', () => {
      const services = Object.keys(SERVICE_SKILL_SETS).sort()
      assert.deepEqual(services, ['ai', 'automation', 'laravel', 'modernization'])
    })

    it('laravel set includes core and service skills', () => {
      const laravel = SERVICE_SKILL_SETS.laravel
      assert(laravel.includes('hurevo-project-rules'))
      assert(laravel.includes('hurevo-laravel'))
      assert(laravel.length > 0)
    })

    it('automation set includes core and automation skills', () => {
      const automation = SERVICE_SKILL_SETS.automation
      assert(automation.includes('hurevo-project-rules'))
      assert(automation.includes('hurevo-automation'))
      assert(automation.length > 0)
    })

    it('ai set includes core and ai solution skills', () => {
      const ai = SERVICE_SKILL_SETS.ai
      assert(ai.includes('hurevo-project-rules'))
      assert(ai.includes('hurevo-ai-solution'))
      assert(ai.length > 0)
    })

    it('modernization set includes core and modernization skills', () => {
      const modernization = SERVICE_SKILL_SETS.modernization
      assert(modernization.includes('hurevo-project-rules'))
      assert(modernization.includes('hurevo-modernization'))
      assert(modernization.length > 0)
    })

    it('all skill sets contain only valid skill names', () => {
      const validNames = new Set(SKILL_NAMES)
      for (const skillSet of Object.values(SERVICE_SKILL_SETS)) {
        for (const skillName of skillSet) {
          assert(validNames.has(skillName), `Invalid skill in set: ${skillName}`)
        }
      }
    })

    it('all skill sets include hurevo-project-rules', () => {
      for (const skillSet of Object.values(SERVICE_SKILL_SETS)) {
        assert(skillSet.includes('hurevo-project-rules'), 'Missing hurevo-project-rules')
      }
    })
  })

  describe('SERVICE_NAMES', () => {
    it('is an array', () => {
      assert(Array.isArray(SERVICE_NAMES))
    })

    it('contains all service names', () => {
      const expected = ['laravel', 'automation', 'ai', 'modernization'].sort()
      assert.deepEqual(SERVICE_NAMES.sort(), expected)
    })

    it('all names match SERVICE_SKILL_SETS keys', () => {
      const serviceKeys = Object.keys(SERVICE_SKILL_SETS).sort()
      const sortedNames = SERVICE_NAMES.sort()
      assert.deepEqual(sortedNames, serviceKeys)
    })
  })
})
