
/*
 * Copyright (c) Aista Ltd, 2021 - 2023 and Thomas Hansen, 2023 - For questions contact team@ainiro.io.
 */

/**
 * A schedule for a scheduled task.
 */
export class Schedule {

  /**
   * Unique ID for schedule instance.
   */
  id: number;

  /**
   * Next due date for task.
   */
  due: Date;

  /**
   * Contains the repetition pattern of task, if task is repeating.
   */
  repeats?: string;
}
