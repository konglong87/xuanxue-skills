const { auditResidence, resolveEntranceBearing } = require('../residence');

describe('住宅纳气输入裁决', () => {
  test('两个门朝向未指定权威来源时不擅自合成', () => {
    expect(resolveEntranceBearing({
      unitDoorBearing: 90,
      homeDoorBearing: 180,
    })).toMatchObject({ status: 'needs_decision', bearing: null });
  });

  test('明确权威门后可继续计算', () => {
    const result = auditResidence({
      unitDoorBearing: 90,
      homeDoorBearing: 180,
      authoritative: 'home-door',
      polygon: [{ x: 0, y: 0 }, { x: 4, y: 0 }, { x: 4, y: 4 }, { x: 0, y: 4 }],
      layout: { 床: '西北' },
    });
    expect(result.status).toBe('ready');
    expect(result.entrance.bearing).toBe(180);
    expect(result.center.一致).toBe(true);
  });
});
