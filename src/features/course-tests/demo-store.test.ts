import { beforeEach, describe, expect, it } from "vitest";
import { addTestQuestion, clearCourseTestDemo, createCourseTest, getCourseTest, getGradingQueue, gradeEssay, listCourseTests, publishCourseTest } from "./demo-store";

describe("teacher course-test local demo", () => {
  beforeEach(() => {
    const values = new Map<string, string>();
    Object.defineProperty(window, "localStorage", { configurable: true, value: {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
      removeItem: (key: string) => values.delete(key),
      clear: () => values.clear(),
    } });
    clearCourseTestDemo();
  });

  it("creates and publishes tests and grades a seeded essay without backend requests", () => {
    const test = createCourseTest(12);
    expect(getCourseTest(test.id)?.status).toBe("draft");
    addTestQuestion(test.id, { position: 0, type: "essay", text: "اشرح فكرتك", code_snippet: null, image_url: null, points: 3, options: [], answer_key: { model_answer: "شرح واضح" }, explanation: null, shuffle_options: false, topic_ref: null });
    publishCourseTest(test.id);
    expect(listCourseTests(12).find((item) => item.id === test.id)?.status).toBe("published");
    const queue = getGradingQueue();
    expect(queue.length).toBeGreaterThan(0);
    gradeEssay(queue[0].answer_id, 2, "إجابة جيدة");
    expect(getGradingQueue().some((item) => item.answer_id === queue[0].answer_id)).toBe(false);
  });
});
