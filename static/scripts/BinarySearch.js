'use strict';

const BinarySearch = (function () {
	/**
	 * Namespace containing functions related to binary search.
	 *
	 * @namespace
	 */
	const BinarySearch = {
		/**
		 * Finds the lower bound of a given value in a given sequence.
		 *
		 * This function locates the first element in `ls` which is not less
		 * than `r` and returns the index of that element.
		 * Suppose `i` is returned from this function, `i` satisfies the
		 * following condition,
		 *
		 *     ls[i - 1] < r <= ls[i]  if 0 < i < ls.length
		 *
		 * `i = 0` if and only if there is no element less than `r` in `ls`.
		 * `i = ls.length` if and only if there is no element greater than or
		 * equal to `r` in `ls`.
		 *
		 * The nature of the operator `<` is defined by `compare`.
		 * NOTE: The right hand side of `compare` is always `r`.
		 *
		 * ### compare
		 *
		 * `compare` should have a signature similar to the following,
		 *
		 *     o = function (lhs, rhs)
		 *
		 * Input,
		 *
		 *  - `lhs`
		 *
		 *    Left hand side of comparison.
		 *    Should be compatible with elements in `ls`.
		 *
		 *  - `rhs`
		 *
		 *    Right hand side of comparison.
		 *    Should be compatible with `r`.
		 *
		 * Output,
		 *
		 *  - `o`
		 *
		 *    Number which represents the relationship between `lhs` and `rhs`.
		 *     - negative if `lhs` is less than `rhs` in this ordering
		 *     - 0 if `lhs` is equal to `rhs` in this ordering
		 *     - positive if `lhs` is greater than `rhs` in this ordering
		 *
		 * May throw an `Error` if `lhs` or `rhs` is incompatible with this
		 * function.
		 *
		 * @param {array} ls
		 *
		 *     Array of values to be searched.
		 *     Must be sorted in ascending order according to `compare`.
		 *
		 * @param r
		 *
		 *     Value to be searched in `ls`.
		 *
		 * @param {function} compare
		 *
		 *     Optional function comparing given two values for order.
		 *     {@link BinarySearch.compare} is used if omitted.
		 *
		 * @return {number}
		 *
		 *     Index of the lower bound.
		 *
		 * @throws {Error}
		 *
		 *     If `ls` is not an array,
		 *     or if `compare` is specified but not a function,
		 *     or if `compare` fails.
		 *
		 * @see BinarySearch.compare
		 *
		 */
		lowerBound: function (ls, r, compare) {
			compare = checkInputs(ls, compare);
			let lower = 0;
			let upper = ls.length;
			while (lower < upper) {
				const center = Math.floor((lower + upper) / 2);
				const order = compare(ls[center], r);
				if (order < 0) {
					// r should be in the upper half
					lower = center + 1;
				} else {
					// r should be in the lower half
					upper = center;
				}
			}
			return lower;
		},

		/**
		 * Finds the upper bound of a given value in a given sequence.
		 *
		 * This function locates the first element in `ls` which is greater
		 * than `r` and returns the index of that element.
		 * Suppose `i` is returned from this function, `i` satisfies the
		 * following condition,
		 *
		 *     ls[i - 1] <= r < ls[i]  if 0 < i < ls.length
		 *
		 * `i = 0` if and only if there is no element less than or equal to
		 * `r` in `ls`.
		 * `i = ls.length` if and only if there is no element greater than
		 * `r` in `ls`
		 *
		 * The nature of the operator `<` is defined by `compare`.
		 * NOTE: The right hand side of `compare` is always `r`.
		 *
		 * ### compare
		 *
		 * `compare` shoud have a signature similar to the following,
		 *
		 *     o = compare(lhs, rhs)
		 *
		 * Input,
		 *
		 *  - `lhs`
		 *
		 *    Left hand side of comparison.
		 *    Should be compatible with elements in `ls`.
		 *
		 *  - `rhs`
		 *
		 *    Right hand side of comparison.
		 *    Should be compatible with `r`.
		 *
		 * Output,
		 *
		 *  - `o`
		 *
		 *    Number which represents the relationship between `lhs` and `rhs`.
		 *     - negative if `lhs` is less than `rhs` in this ordering
		 *     - 0 if `lhs` is equal to `rhs` in this ordering
		 *     - positive if `lhs` is greater than `rhs` in this ordering
		 *
		 * May throw an `Error` if `lhs` or `rhs` is incompatible with this
		 * function.
		 *
		 * @param {array} ls
		 *
		 *     Array of values to be searched.
		 *     Must be sorted in ascending order according to `compare`.
		 *
		 * @param r
		 *
		 *     Value to be searched in `ls`.
		 *
		 * @param {function} compare
		 *
		 *     Optional function comparing given two values for order.
		 *     {@link BinarySearch.compare} is used if omitted.
		 *
		 * @return {number}
		 *
		 *     Index of the upper bound.
		 *
		 * @throws {Error}
		 *
		 *     If `ls` is not an array,
		 *     or if `compare` is specified but not a function,
		 *     or if `compare` fails.
		 *
		 * @see BinarySearch.compare
		 *
		 */
		upperBound: function (ls, r, compare) {
			compare = checkInputs(ls, compare);
			let lower = 0;
			let upper = ls.length;
			while (lower < upper) {
				const center = Math.floor((lower + upper) / 2);
				const order = compare(ls[center], r);
				if (order <= 0) {
					// r should be in the upper half
					lower = center + 1;
				} else {
					// r should be in the lower half
					upper = center;
				}
			}
			return upper;
		},

		/**
		 * Default compare function which can be specified to binary search
		 * functions.
		 *
		 * `l` and `r` can be any type which supports `<` and `>` comparison
		 * operators.
		 *
		 * @param l
		 *
		 *     Left hand side of comparison.
		 *
		 * @param r
		 *
		 *     Right hand side of comparison.
		 *
		 * @return {number}
		 *
		 *     Number which represents the relationship between `l` and `r`,
		 *      - negative if `l < r`,
		 *      - positive if `l > r`
		 *      - 0 otherwise
		 *
		 */
		compare: function (l, r) {
			if (l < r) {
				return -1;
			} else if (l > r) {
				return 1;
			} else {
				return 0;
			}
		}
	};

	// checks the input for `lowerBound` or `upperBound`,
	// and returns the comparison function to be used.
	function checkInputs(ls, compare) {
		// checks inputs
		if (!Array.isArray(ls)) {
			throw new Error(`ls must be an array but '${typeof ls}'`);
		}
		if (compare == null) {
			compare = BinarySearch.compare;
		} else if (typeof compare !== 'function') {
			throw new Error(`compare must be a function if specified but '${typeof compare}'`);
		}
		return compare;
	}

	return BinarySearch;
})();

