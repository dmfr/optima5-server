Ext.define('Optima5.Modules.CrmBase.MainWindowButton',{
	extend:'Ext.button.Button',
	alias: 'widget.op5crmbasemwbutton',
	
	renderTpl: [
		'<span id="{id}-btnWrap" role="presentation" class="{baseCls}-wrap',
			'<tpl if="splitCls"> {splitCls}</tpl>',
			'{childElCls}" unselectable="on">',
			'<span id="{id}-btnEl" class="{baseCls}-button" role="presentation">',
				'<span id="{id}-btnInnerEl" class="{baseCls}-inner {innerCls}',
					'{childElCls}" unselectable="on">',
						'<span id="{id}-btnInnerTextTitle" class="op5-crmmbase-mainwindowbtn-title">{textTitle}</span>',
						'&nbsp;&nbsp;',
						'<span id="{id}-btnInnerTextRedcount" class="op5-crmmbase-mainwindowbtn-redcount">({textRedcount})</span>',
						'<br/>',
						'<span id="{id}-btnInnerTextCaption" class="op5-crmmbase-mainwindowbtn-caption">{textCaption}</span>',
				'</span>',
				'<span role="presentation" id="{id}-btnIconEl" class="{baseCls}-icon-el {iconCls}',
					'{childElCls} {glyphCls}" unselectable="on" style="',
					'<tpl if="iconUrl">background-image:url({iconUrl});</tpl>',
					'<tpl if="glyph && glyphFontFamily">font-family:{glyphFontFamily};</tpl>">',
					'<tpl if="glyph">&#{glyph};</tpl><tpl if="iconCls || iconUrl">&#160;</tpl>',
				'</span>',
			'</span>',
		'</span>',
		// if "closable" (tab) add a close element icon
		'<tpl if="closable">',
			'<span id="{id}-closeEl" role="presentation"',
					' class="{baseCls}-close-btn"',
					'<tpl if="closeText">',
						' title="{closeText}" aria-label="{closeText}"',
					'</tpl>',
					'>',
			'</span>',
		'</tpl>'
	],
	
	initComponent: function() {
		var me = this ;
		
		me.addChildEls('btnInnerTextTitle','btnInnerTextRedcount','btnInnerTextCaption') ;
		 
		Ext.apply(me,{
			//height:32,
			scale:'large',
			text:me.getText()
		});
		
		me.callParent() ;
	},
	afterRender: function() {
		var me = this;
		me.setComponentCls();
	},
	getTemplateArgs: function() {
		var me = this ;
		return Ext.apply(me.callParent(),{
			textTitle: me.textTitle || '&#160;',
			textRedcount: me.textRedcount || '',
			textCaption: me.textCaption || '&#160;'
		});
	},
	getText: function() {
		var me = this ;
		return me.textTitle + ' ' + me.textRedcount + '<br>' + me.textCaption ;
	},
	setObjText: function( obj ) {
		var me = this ;
		me.textTitle = obj.title;
		me.textRedcount = obj.redcount;
		me.textCaption = obj.caption;
		if (me.el) {
			me.btnInnerTextTitle.update(me.textTitle || '&#160;');
			me.btnInnerTextRedcount.update('(' + (me.textRedcount || '&#160;') + ')');
			me.btnInnerTextCaption.update(me.textCaption || '&#160;');
			me.setComponentCls();
		}
		me.doComponentLayout() ;
	},
	getObjText: function() {
		var me = this ;
		return {
			title: me.textTitle,
			redcount: me.textRedcount,
			caption: me.textCaption
		} ;
	},
	setComponentCls: function() {
		var me = this ;
		me.callParent() ;
		if( me.textRedcount && me.textRedcount != '' ) {
			me.btnInnerTextRedcount.show() ;
		} else {
			me.btnInnerTextRedcount.hide() ;
		}
	}
});