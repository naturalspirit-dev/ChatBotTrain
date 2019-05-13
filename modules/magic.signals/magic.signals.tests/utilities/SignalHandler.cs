/*
 * Magic, Copyright(c) Thomas Hansen 2019 - thomas@gaiasoul.com
 * Licensed as Affero GPL unless an explicitly proprietary license has been obtained.
 */

using Newtonsoft.Json.Linq;
using magic.signals.contracts;

namespace magic.signals.tests.utilities
{
    [Slot(Name = "foo.bar")]
    public class SignalHandler : ISlot
    {
        public void Signal(JObject input)
        {
            input["bar"] = input["bar"].Value<string>() + "Yup!";
        }
    }
}
