﻿/*
 * Magic, Copyright(c) Thomas Hansen 2019 - thomas@gaiasoul.com
 * Licensed as Affero GPL unless an explicitly proprietary license has been obtained.
 */

using System;
using System.Linq;
using System.Collections.Generic;
using magic.node;
using magic.node.extensions;
using magic.signals.contracts;

namespace magic.lambda.branching
{
    [Slot(Name = "if")]
    public class If : ISlot
    {
        readonly ISignaler _signaler;

        public If(ISignaler signaler)
        {
            _signaler = signaler ?? throw new ArgumentNullException(nameof(signaler));
        }

        public void Signal(Node input)
        {
            if (input.Children.Count() != 2)
                throw new ApplicationException("Keyword [if] requires exactly two child nodes, one comparer node and one [.lambda] node, in that sequence");

            var lambda = input.Children.Skip(1).First();
            if (lambda.Name != ".lambda")
                throw new ApplicationException("Keyword [if] requires its second child to be [.lambda]");

            _signaler.Signal("eval", input);

            if (input.Children.First().GetEx<bool>(_signaler))
                _signaler.Signal("eval", lambda);
        }
    }
}
