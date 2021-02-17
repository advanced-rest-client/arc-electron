/**
 * Gets an index of the tab which is the source of one of the pre-build actions.
 * @param {Element} target
 * @return {number} An index of the tab
 */
export function getTabClickIndex(target) {
  const tab = target.closest('workspace-tab');
  return Array.from(tab.parentElement.children).filter((node) => node.localName === tab.localName).indexOf(tab);
}
