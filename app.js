Ext.Loader.setConfig({
	enabled: true,
	disableCaching: true,
	paths: {
		'Ext': './extjs/src', 
		'Ext.ux' : './js/ux',
		'Ext.calendar' : './js/ext/calendar',
		'Sch' : './js/sch',
		'Optima5' : './js/app'
		}
});
Ext.require('Ext.*') ;
Ext.require('Optima5.App');
Ext.require('Optima5.Modules.All');

var op5desktop, op5session ;
Ext.onReady(function () {
	/*
	Load record for multi-select COMBO
	http://www.sencha.com/forum/archive/index.php/t-202456.html?s=ef437a00595a4b216c80d979879ef5fc
	http://stackoverflow.com/questions/6299164/using-ext-form-basic-loadrecord-to-load-data-into-combo-box-fields-with-remote-s
	*/
	Ext.form.field.ComboBox.override( {
		setValue: function(v) {
			if( Ext.JSON.decode(v,true) != null ) {
				arguments[0] = Ext.JSON.decode(v) ;
			}
			this.callOverridden(arguments);
		}
	});
	
	/*
	DATE FIELD : treat 0000-00-00 as null
	*/
	Ext.form.field.Date.override( {
		setValue: function() {
			if( arguments[0] == '0000-00-00' ) {
				arguments[0] = null ;
			}
			this.callOverridden(arguments);
		}
	});
	
	/*
	 * Hide grouping summary if empty
	 */
	Ext.grid.feature.GroupingSummary.override({
		outputSummaryRecord: function(summaryRecord, contextValues, out) {
			var view = contextValues.view,
					columns = contextValues.columns || view.headerCt.getVisibleGridColumns(),
					colCount = columns.length, i, column,
					isNull = true ;
			for (i = 0; i < colCount; i++) {
					column = columns[i];
				if (!column.summaryType) {
					continue ;
				}
				if( !column.dataIndex || summaryRecord.get(column.dataIndex) == null ) {
					continue ;
				}
				isNull = false ;
			}
			
			if( isNull ) {
				return ;
			}
			this.callOverridden(arguments) ;
		}
	}) ;
	
	
	
	
	/*
	 * From Ext 5.1.1, Floating inside other ELs seem to mess with Ext.dom.GarbageCollector
	 * Guess: Ext.util.Floating tries to reuse shadows cleared/invalidated by garbageCollector before ???
	 */
	Ext.util.Floating.override({
		//shadow: false
	}) ;
	Ext.dom.Underlay.override({
		hide: function() {
			this.callOverridden(arguments) ;
			this.getPool().reset() ;
		}
	}) ;
	
	/*
	 * Ext 5.1.1 : BufferedRenderer + Locking + GroupingSummary = bug on destroy if store updated 
	 * https://www.sencha.com/forum/showthread.php?303291-Grid-BufferedRenderer-Locking-GroupingSummary-bug-on-destroy-if-store-updated
	 * Seems GlobalEvent 'afterlayout' set in Ext.grid.locking.View::onUpdate is not consumed until final destroy (where it's too late to dig up records ?)
	 */
	Ext.grid.plugin.BufferedRenderer.override({
		refreshSize: function() {
			if( !this.store.data ) {
				return ;
			}
			this.callOverridden(arguments) ;
		}
	});
	
	/*
	 * Ext 5.1.1 : applyRoot if TreeStore::setRoot() called with NodeInterface
	 */
	Ext.data.TreeStore.override({
		
		/*
		 * DAMS : prevent filtering lag 
		 */
		setRootNode: function(root) {
			this.suspendFilters = true ;
			var ret = this.callOverridden(arguments) ;
			this.suspendFilters = false ;
			
			// HACK : DAMS , recover filter AFTER setRootNode
			this.doFilter(this.getRoot()) ;
			// onNodeFilter copy
			root = this.getRoot() ;
			var filteredNodes = [];
			var childNodes = root.childNodes;
			for (i = 0, length = childNodes.length; i < length; i++) {
				childNode = childNodes[i];
				if (childNode.get('visible')) {
						filteredNodes.push(childNode);
				}
			}
			this.onNodeFilter(root, filteredNodes);
			// HACK : end
			
			return ret ;
		},
		
		/*
		* https://www.sencha.com/forum/showthread.php?302493-onNodeInsert-function-implementation-bug
		*/
		indexOfPreviousVisibleNode: function(node) {
			var result;

			// Find the previous visible sibling (filtering may have knocked out intervening nodes)
			for (result = node; result && !result.get('visible'); result = result.previousSibling) {
					// This block is intentionally left blank
			}

			// If found, and there are child nodes, do the same operation on the last child
			if (result) {
					if (result.isExpanded() && result.lastChild) {
						return this.indexOfPreviousVisibleNode(result.lastChild)
					}
			}
			// If there is no previous visible sibling, we use the parent node.
			// We only even ATTEMPT to insert into the flat store children of visible nodes.
			else {
					result = node.parentNode
			}

			return this.indexOf(result);
		},
		onNodeInsert: function(parent, node, index) {
			var me = this,
					data = node.raw || node.data,
					// Must use class-specific removedNodes property.
					// Regular Stores add to the "removed" property on CollectionRemove.
					// TreeStores are having records removed all the time; node collapse removes.
					// TreeStores add to the "removedNodes" property onNodeRemove
					removed = me.removedNodes,
					storeReader,
					nodeProxy,
					nodeReader,
					reader,
					dataRoot,
					storeInsertionPoint;

			if (parent && me.needsLocalFilter() && !me.suspendFilters) { // HACK: DAMS
					me.doFilter(parent);
			}

			me.beginUpdate();

			// Only react to a node append if it is to a node which is expanded.
			if (me.isVisible(node)) {

					// Calculate the insertion point into the flat store.
					// If the new node is the first, then it goes after the parent node.
					if (index === 0 || !node.previousSibling) {
						storeInsertionPoint = me.indexOf(parent);
					}
					// Otherwise it has to go after the previous visible node which has
					// to be calculated. See indexOfPreviousVisibleNode for explanation.
					else {
						storeInsertionPoint = me.indexOfPreviousVisibleNode(node.previousSibling);
					}

					// The reaction to collection add joins the node to this Store
					me.insert(storeInsertionPoint + 1, node);
					if (!node.isLeaf() && node.isExpanded()) {
						if (node.isLoaded()) {
							// Take a shortcut
							me.onNodeExpand(node, node.childNodes);
						} else if (!me.fillCount) {
							// If the node has been marked as expanded, it means the children
							// should be provided as part of the raw data. If we're filling the nodes,
							// the children may not have been loaded yet, so only do this if we're
							// not in the middle of populating the nodes.
							node.set('expanded', false);
							node.expand();
						}
					}
			}

			// In case the node was removed and added to the removed nodes list.
			Ext.Array.remove(removed, node);

			// New nodes mean we need a sync if those nodes are phantom or dirty (have client-side only information)
			me.needsSync = me.needsSync || node.phantom || node.dirty;

			if (!node.isLeaf() && !node.isLoaded() && !me.lazyFill) {
					// With heterogeneous nodes, different levels may require differently configured readers to extract children.
					// For example a "Disk" node type may configure it's proxy reader with root: 'folders', while a "Folder" node type
					// might configure its proxy reader with root: 'files'. Or the root property could be a configured-in accessor.
					storeReader = me.getProxy().getReader();
					nodeProxy = node.getProxy();
					nodeReader = nodeProxy ? nodeProxy.getReader() : null;

					// If the node's reader was configured with a special root (property name which defines the children array) use that.
					reader = nodeReader && nodeReader.initialConfig.rootProperty ? nodeReader : storeReader;

					dataRoot = reader.getRoot(data);
					if (dataRoot) {
						me.fillNode(node, reader.extractData(dataRoot, {
							model: node.childType,
							recordCreator: me.recordCreator
						}));
					}
			}
			me.endUpdate();
		},
		
		
		applyRoot: function(newRoot) {
			newRoot = this.callOverridden(arguments) ;
			
			var me = this ;
			if( newRoot && newRoot.isNode && newRoot.isRoot() ) {
				newRoot.store = newRoot.treeStore = me;
			}
			return newRoot ;
		},
		privates: {
			filterNodes: function(root, node, filterFn) {
				/*
				* https://www.sencha.com/forum/showthread.php?296893-Filtering-tree-store
				*/
				var match = false,
					childNodes = node.childNodes,
					len = childNodes && childNodes.length,
					i, child;
				if (len) {
					for (i = 0; i < len; ++i) {
						// match needs to be true if any child nodes have been found to match
						match = this.filterNodes(root, childNodes[i], filterFn) || match;
					}
				}
				// match if a child matches, or if the current node matches.
				match = match || (node === root || filterFn(node));
				node.set('visible', match, this._silentOptions);
				if( match && node !== root ) { // HACK : DAMS , display children if parent matches
					node.cascadeBy( function(childNode) {
						if( childNode==node ) {
							return ;
						}
						childNode.set('visible', true, this._silentOptions);
					},this) ;
				}
				return match;
			}
		}
	});
	
	/*
	 * Ext 5.1.1 : onUpdate if filtered => non-existant group => metaGroup isCollapsed not defined
	 * fixed in 5.1.2 ?
	 */
	Ext.grid.feature.GroupStore.override({
		onUpdate: function(store, record, operation, modifiedFieldNames) {
			var me = this,
				groupingFeature = me.groupingFeature ;
			
			if (store.isGrouped() && !groupingFeature.getGroup(record)) {
				me.fireEvent('update', me, record, operation, modifiedFieldNames);
				return ;
			}
			
			this.callOverridden(arguments) ;
		}
	});
	/*
	 * https://www.sencha.com/forum/showthread.php?301099-Grouping-is-not-working-when-value-is-null/page2
	 * http://forums.ext.net/showthread.php?60224&p=275467&viewfull=1#post275467
	 */
	Ext.grid.feature.Grouping.override({
		// Overridden because of #919
		getMetaGroup: function (group) {
			var metaGroupCache = this.metaGroupCache || this.createCache(),
					key,
					metaGroup;

			if (group.isModel) {
					group = this.getGroup(group);
			}

			if (group != null) { // #919. Do not replace with "!==", beucase it should filter for null and undefined.
					key = (typeof group === 'string') ? group : group.getGroupKey();
					metaGroup = metaGroupCache[key];

					if (!metaGroup) {
						metaGroup = metaGroupCache[key] = {
							isCollapsed: false,
							lastGroup: null,
							lastGroupGeneration: null,
							lastFilterGeneration: null,
							aggregateRecord: new Ext.data.Model()
						};

						if (!metaGroupCache.map) {
							metaGroupCache.map = {};
						}

						metaGroupCache.map[key] = true;
					}
			}

			return metaGroup;
		}
	});
	
	/*
	 * Chrome 43 / Charts ? : draw problem
	 */
	Ext.chart.Chart.override({
		initComponent: function() {
			Ext.apply(this,{
				animate: false
			});
			this.callOverridden(arguments);
			this.on('afterrender', function(chart) {
				Ext.defer(function(){chart.redraw();},100,this);
			});
		}
	});
	
	/*
	 * Disable NavigationModels
	 */
	Ext.view.NavigationModel.override({
		focusCls: ''
	});
	Ext.grid.NavigationModel.override({
		focusCls: ''
	});
	
	
	
	Ext.event.publisher.Focus.override({ // input.x-tree-checkbox has no parent Node ????
    doDelegatedEvent: function(e, invokeAfter) {
        var me = this,
            relatedTarget;

		if (Ext.browser.is.Firefox) {
			e = me.callParent([e, false]);
		} else {
			e = me.callSuper([e, false]);
		}

        if (e) {
            if (e.type === 'focusout' && e.target != null) {
                // If focus is departing to the document, there will be no forthcoming focusin event
                // to trigger a focusleave, to fire a focusleave now.
                if (e.relatedTarget == null && !e.target.matches('input.x-tree-checkbox')) {
                    me.processFocusIn(e, e.target, document.body, invokeAfter);
                } else {
						 
					 }
            }
            else {
                relatedTarget = e.relatedTarget;

                // IE reports relatedTarget as either an inaccessible object which coercively equates to null, or just a blank object in the case of focusing from nowhere.
                // So we can't use a truth test ternary expression to substitute in document.body.
                me.processFocusIn(e, (relatedTarget == null || !relatedTarget.tagName) ? document.body : relatedTarget, e.target, invokeAfter);
            }
        }
    }
	});
	
	
	
	Ext.grid.column.Action.override({
		defaultRenderer: function(v, cellValues, record, rowIdx, colIdx, store, view) {
			var me = this,
					scope = me.origScope || me,
					items = me.items,
					len = items.length,
					i, item, ret, disabled, tooltip;
	
			// Allow a configured renderer to create initial value (And set the other values in the "metadata" argument!) 
			// Assign a new variable here, since if we modify "v" it will also modify the arguments collection, meaning 
			// we will pass an incorrect value to getClass/getTip 
			ret = Ext.isFunction(me.origRenderer) ? me.origRenderer.apply(scope, arguments) || '' : '';
	
			cellValues.tdCls += ' ' + Ext.baseCSSPrefix + 'action-col-cell';
			for (i = 0; i < len; i++) {
					item = items[i];
	
					disabled = item.disabled || (item.isDisabled ? item.isDisabled.call(item.scope || scope, view, rowIdx, colIdx, item, record) : false);
					tooltip = disabled ? null : (item.tooltip || (item.getTip ? item.getTip.apply(item.scope || scope, arguments) : null));
	
					// Only process the item action setup once. 
					if (!item.hasActionConfiguration) {
						// Apply our documented default to all items 
						item.stopSelection = me.stopSelection;
						item.disable = Ext.Function.bind(me.disableAction, me, [i], 0);
						item.enable = Ext.Function.bind(me.enableAction, me, [i], 0);
						item.hasActionConfiguration = true;
					}
	
					ret += '<img role="button" alt="' + (item.altText || me.altText) + '" src="' + (item.icon || Ext.BLANK_IMAGE_URL) +
						'" class="' + me.actionIconCls + ' ' + Ext.baseCSSPrefix + 'action-col-' + String(i) + ' ' +
						(disabled ? me.disabledCls + ' ' : ' ') +
						(Ext.isFunction(item.getClass) ? item.getClass.apply(item.scope || scope, arguments) : (item.iconCls || me.iconCls || '')) + '"' +
						(tooltip ? ' data-qtip="' + tooltip + '"' : '') + ' />';
			}
			return ret;
		}
	});
	
	
	
	/*
	 * Désactiver le drag&drop file=>browser(open)
	 */
	window.ondragenter = function(e) {
		e.dataTransfer.dropEffect = 'none';
		e.preventDefault();
		return false;
	};
	window.ondragover = function(e) {
		e.preventDefault();
		return false;
	};
	window.ondrop = function(e) {
		return false;
	};
	window.ondragleave = function(e) {
		return false;
	};
	
	/*
	Désactiver le click droit
	*/
	Ext.getDoc().on('contextmenu', function(e){
		e.preventDefault() ;
	}) ;
	Ext.getDoc().on('keydown', function(e){
		if( e.getKey() == e.BACKSPACE && !Ext.Array.contains(['text','password','textarea'], e.getTarget().type) ) {
			e.preventDefault();
		}
	}) ;
	
	// onReady : bootstrap Optima app.
	Ext.create('Optima5.App',{}) ;
	
	
	// Needed by Ext.Scheduler :
	Ext.data.Connection.override({
		parseStatus: function (b) {
			var a = this.callOverridden(arguments);
			if (b === 0) {
					a.success = true
			}
			return a
		}
	});
});
