/*
 * Magic, Copyright(c) Thomas Hansen 2019 - thomas@gaiasoul.com
 * Licensed as Affero GPL unless an explicitly proprietary license has been obtained.
 */

using Xunit;
using magic.node;
using magic.signals.contracts;

namespace magic.tests.tests.lambda
{
    public class ForEachTests
    {
        [Slot(Name = "foo2")]
        public class Foo2Slot : ISlot
        {
            public static int ExecutionCount;

            public void Signal(Node input)
            {
                ++ExecutionCount;
            }
        }

        [Fact]
        public void ForEach_01()
        {
            Common.Evaluate(@".foo1
   bar1
   bar2
   bar3
for-each:x:../*/.foo1/*
   foo2");
            Assert.Equal(3, Foo2Slot.ExecutionCount);
        }
    }
}
